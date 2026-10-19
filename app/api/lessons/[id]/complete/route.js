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
  const [{ entry, tree: before }, quizCount] = await Promise.all([
    getLessonAccess(user.id, params.id),
    prisma.quizQuestion.count({ where: { lessonId: params.id } }),
  ]);
  if (!entry?.lesson.access.open) throw forbidden("هذا الدرس غير متاح لك");

  // The tree already carries the student's progress row for this lesson.
  const progress = entry.lesson.progress;
  if (progress?.completedAt) {
    return { already: true, xpEarned: 0, achievements: [], nextLessonId: nextOpenLesson(before, entry.course.id, params.id) };
  }
  if (quizCount > 0 && progress?.quizTotal == null) throw badRequest("أجب عن اختبار الدرس أولًا");

  const perfect = quizCount > 0 && progress.quizScore === progress.quizTotal;
  const xpEarned = entry.lesson.xpReward + (perfect ? PERFECT_QUIZ_BONUS : 0);

  // Conditional update = only one concurrent request can complete the lesson (no double XP).
  if (!progress) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: params.id } },
      update: {},
      create: { userId: user.id, lessonId: params.id },
    });
  }
  const { count } = await prisma.lessonProgress.updateMany({
    where: { userId: user.id, lessonId: params.id, completedAt: null },
    data: { completedAt: new Date(), xpEarned },
  });
  if (!count) return { already: true, xpEarned: 0, achievements: [], nextLessonId: null };

  // The next-lesson lookup only needs the completion above, so it runs while XP and badges are awarded.
  const treeAfter = buildStudentTree(user.id);
  treeAfter.catch(() => {});
  await Promise.all([awardXp(user.id, xpEarned), recordActivity(user.id)]);
  const achievements = await evaluateAchievements(user.id);

  return { xpEarned, perfect, achievements, nextLessonId: nextOpenLesson(await treeAfter, entry.course.id, params.id) };
});
