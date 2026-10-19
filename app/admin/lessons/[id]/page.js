import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurriculum } from "@/lib/admin-data";
import { LessonEditor } from "@/components/admin/LessonEditor";
import { parseJSON } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const l = await prisma.lesson.findUnique({ where: { id }, select: { title: true } });
  return { title: l?.title ? `تحرير: ${l.title}` : "درس" };
}

export default async function AdminLessonPage({ params }) {
  const { id } = await params;
  // One round trip: the lesson, its quiz and the (small) curriculum tree load together instead of module → course → modules chained.
  const [, lesson, quiz, levels] = await Promise.all([
    requireAdmin(),
    prisma.lesson.findUnique({ where: { id } }),
    prisma.quizQuestion.findMany({ where: { lessonId: id }, orderBy: { order: "asc" } }),
    getCurriculum(),
  ]);
  if (!lesson) notFound();
  const course = levels.flatMap((l) => l.courses).find((c) => c.modules.some((m) => m.id === lesson.moduleId));
  if (!course) notFound();

  return (
    <LessonEditor
      course={{ id: course.id, title: course.title }}
      modules={course.modules.map((m) => ({ id: m.id, title: m.title }))}
      lesson={{
        id: lesson.id,
        moduleId: lesson.moduleId,
        title: lesson.title,
        summary: lesson.summary ?? "",
        xpReward: lesson.xpReward,
        durationMin: lesson.durationMin,
        isPublished: lesson.isPublished,
        blocks: parseJSON(lesson.blocks, []),
        quiz: quiz.map((q) => ({
          question: q.question,
          options: parseJSON(q.options, []),
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? "",
        })),
      }}
    />
  );
}
