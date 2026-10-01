import { prisma } from "@/lib/db";
import { badRequest, forbidden, handler } from "@/lib/api";
import { buildStudentTree, getLessonAccess } from "@/lib/access";
import { awardXp, evaluateAchievements, recordActivity } from "@/lib/rewards";

const PERFECT_QUIZ_BONUS = 5;

function nextOpenLesson(tree, courseId, lessonId) {
  for (const level of tree.levels) {
    const course = level.courses.find((c) => c.id === courseId);
    if (!course) continue;
    const lessons = course.modules.flatMap((m) => m.lessons);
    const idx = lessons.findIndex((l) => l.id === lessonId);
    return lessons.slice(idx + 1).find((l) => l.access.open)?.id ?? null;
  }
  return null;
}

export const POST = handler({ role: "STUDENT" }, async ({ user, params }) => {
  const { entry } = await getLessonAccess(user.id, params.id);
  if (!entry?.lesson.access.open) throw forbidden("هذا الدرس غير متاح لك");

  const [quizCount, progress] = await Promise.all([
    prisma.quizQuestion.count({ where: { lessonId: params.id } }),
    prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: params.id } } }),
  ]);
  if (progress?.completedAt) {
    return { already: true, xpEarned: 0, achievements: [], nextLessonId: nextOpenLesson(await buildStudentTree(user.id), entry.course.id, params.id) };
  }
  if (quizCount > 0 && progress?.quizTotal == null) throw badRequest("أجب عن اختبار الدرس أولًا");

  const perfect = quizCount > 0 && progress.quizScore === progress.quizTotal;
  const xpEarned = entry.lesson.xpReward + (perfect ? PERFECT_QUIZ_BONUS : 0);

  // Conditional update = only one concurrent request can complete the lesson (no double XP).
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: params.id } },
    update: {},
    create: { userId: user.id, lessonId: params.id },
  });
  const { count } = await prisma.lessonProgress.updateMany({
    where: { userId: user.id, lessonId: params.id, completedAt: null },
    data: { completedAt: new Date(), xpEarned },
  });
  if (!count) return { already: true, xpEarned: 0, achievements: [], nextLessonId: null };

  await awardXp(user.id, xpEarned);
  await recordActivity(user.id);
  const achievements = await evaluateAchievements(user.id);

  const tree = await buildStudentTree(user.id);
  return { xpEarned, perfect, achievements, nextLessonId: nextOpenLesson(tree, entry.course.id, params.id) };
});
