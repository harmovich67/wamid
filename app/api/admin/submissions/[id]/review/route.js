import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { reviewSchema } from "@/lib/validators";
import { awardXp, evaluateAchievements } from "@/lib/rewards";
import { notify } from "@/lib/notify";

export const POST = handler({ role: "ADMIN" }, async ({ req, user, params }) => {
  const { status, grade, feedback } = await parseBody(req, reviewSchema);
  const submission = await prisma.submission.findUnique({ where: { id: params.id }, include: { task: true } });
  if (!submission) throw notFound("التسليم غير موجود");

  // XP scales with the grade; re-reviews only apply the difference.
  const points = status === "APPROVED" ? Math.round((submission.task.points * (grade ?? 100)) / 100) : 0;
  const delta = points - submission.pointsAwarded;

  await prisma.submission.update({
    where: { id: params.id },
    data: { status, grade: grade ?? null, feedback: feedback ?? null, pointsAwarded: points, reviewerId: user.id, reviewedAt: new Date() },
  });
  if (delta) await awardXp(submission.studentId, delta);

  await notify(submission.studentId, {
    type: "FEEDBACK",
    title: status === "APPROVED" ? `تم قبول حلّك: ${submission.task.title} 🎉` : `ملاحظات على حلّك: ${submission.task.title}`,
    body: status === "APPROVED" && points ? `حصلت على ${points} XP` : "راجع ملاحظات المعلّم وأعد التسليم",
    link: `/tasks/${submission.taskId}`,
  });
  const achievements = status === "APPROVED" ? await evaluateAchievements(submission.studentId) : [];
  return { ok: true, points, achievements: achievements.length };
});
