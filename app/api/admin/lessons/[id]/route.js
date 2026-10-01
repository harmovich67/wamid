import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { lessonUpdateSchema } from "@/lib/validators";
import { deleteRulesFor } from "@/lib/admin-data";
import { notifyLessonAudience } from "@/lib/access";

export const PATCH = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const { blocks, quiz, notifyStudents, ...data } = await parseBody(req, lessonUpdateSchema);
  await prisma.$transaction(async (tx) => {
    await tx.lesson.update({
      where: { id: params.id },
      data: { ...data, ...(blocks ? { blocks: JSON.stringify(blocks) } : {}) },
    });
    if (quiz) {
      await tx.quizQuestion.deleteMany({ where: { lessonId: params.id } });
      if (quiz.length) {
        await tx.quizQuestion.createMany({
          data: quiz.map((q, i) => ({
            lessonId: params.id,
            order: i,
            question: q.question,
            options: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            explanation: q.explanation ?? null,
          })),
        });
      }
    }
  });
  if (notifyStudents && data.isPublished) await notifyLessonAudience(params.id);
  return { ok: true };
});

export const DELETE = handler({ role: "ADMIN" }, async ({ params }) => {
  await deleteRulesFor({ LESSON: [params.id] });
  await prisma.lesson.delete({ where: { id: params.id } });
  return { ok: true };
});
