import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, forbidden, handler, parseBody } from "@/lib/api";
import { getLessonAccess } from "@/lib/access";
import { recordActivity } from "@/lib/rewards";

const schema = z.object({ answers: z.array(z.number().int().min(0).max(10)).max(50) });

// Grades the quiz on the server — correct answers are never sent before the student answers.
export const POST = handler({ role: "STUDENT" }, async ({ req, user, params }) => {
  const { answers } = await parseBody(req, schema);
  const [{ entry }, questions] = await Promise.all([
    getLessonAccess(user.id, params.id),
    prisma.quizQuestion.findMany({ where: { lessonId: params.id }, orderBy: { order: "asc" } }),
  ]);
  if (!entry?.lesson.access.open) throw forbidden("هذا الدرس غير متاح لك");
  if (!questions.length) throw badRequest("لا يوجد اختبار لهذا الدرس");
  if (answers.length !== questions.length) throw badRequest("أجب عن جميع الأسئلة");

  const results = questions.map((q, i) => ({
    correct: answers[i] === q.correctIndex,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
  const score = results.filter((r) => r.correct).length;
  const total = questions.length;

  const existing = entry.lesson.progress; // the tree already carries this lesson's progress row
  const best = existing?.quizScore != null && existing.quizTotal === total ? Math.max(existing.quizScore, score) : score;
  await Promise.all([
    prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: params.id } },
      update: { quizScore: best, quizTotal: total },
      create: { userId: user.id, lessonId: params.id, quizScore: score, quizTotal: total },
    }),
    recordActivity(user.id),
  ]);
  // Per-question history (the first answer is kept: it shows what the class really understood) is
  // bookkeeping the student doesn't wait for: it runs after the response is sent.
  after(async () => {
    try {
      await prisma.$transaction(
        questions.map((q, i) =>
          prisma.quizAnswer.upsert({
            where: { userId_questionId: { userId: user.id, questionId: q.id } },
            update: { lastAnswer: answers[i], lastCorrect: results[i].correct, attempts: { increment: 1 } },
            create: {
              userId: user.id,
              questionId: q.id,
              lessonId: params.id,
              firstAnswer: answers[i],
              firstCorrect: results[i].correct,
              lastAnswer: answers[i],
              lastCorrect: results[i].correct,
            },
          })
        )
      );
    } catch (err) {
      console.error("[quiz]", err);
    }
  });

  return { score, total, results };
});
