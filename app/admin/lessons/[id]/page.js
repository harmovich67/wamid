import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LessonEditor } from "@/components/admin/LessonEditor";
import { parseJSON } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const l = await prisma.lesson.findUnique({ where: { id }, select: { title: true } });
  return { title: l?.title ? `تحرير: ${l.title}` : "درس" };
}

export default async function AdminLessonPage({ params }) {
  const { id } = await params;
  await requireAdmin();
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      quiz: { orderBy: { order: "asc" } },
      module: { include: { course: { include: { modules: { orderBy: { order: "asc" }, select: { id: true, title: true } } } } } },
    },
  });
  if (!lesson) notFound();

  return (
    <LessonEditor
      course={{ id: lesson.module.course.id, title: lesson.module.course.title }}
      modules={lesson.module.course.modules}
      lesson={{
        id: lesson.id,
        moduleId: lesson.moduleId,
        title: lesson.title,
        summary: lesson.summary ?? "",
        xpReward: lesson.xpReward,
        durationMin: lesson.durationMin,
        isPublished: lesson.isPublished,
        blocks: parseJSON(lesson.blocks, []),
        quiz: lesson.quiz.map((q) => ({
          question: q.question,
          options: parseJSON(q.options, []),
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? "",
        })),
      }}
    />
  );
}
