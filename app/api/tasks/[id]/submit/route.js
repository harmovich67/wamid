import { prisma } from "@/lib/db";
import { badRequest, forbidden, handler, parseBody } from "@/lib/api";
import { canAccessTask } from "@/lib/access";
import { recordActivity } from "@/lib/rewards";
import { submissionSchema } from "@/lib/validators";

export const POST = handler({ role: "STUDENT" }, async ({ req, user, params }) => {
  const data = await parseBody(req, submissionSchema);
  const task = await canAccessTask(user.id, params.id);
  if (!task?.access.open) throw forbidden("هذه المهمة غير متاحة لك");
  if (task.submission?.status === "APPROVED") throw badRequest("تم قبول هذا التسليم مسبقًا");

  // Students may only attach files they uploaded themselves.
  const fileIds = data.files.map((f) => f.url.split("/").pop());
  if (fileIds.length) {
    const owned = await prisma.upload.count({ where: { id: { in: fileIds }, ownerId: user.id } });
    if (owned !== fileIds.length) throw forbidden("ملف غير صالح");
  }

  const payload = {
    content: data.content ?? null,
    code: data.code ?? null,
    links: JSON.stringify(data.links),
    files: JSON.stringify(data.files),
    status: "SUBMITTED",
    submittedAt: new Date(),
  };
  const submission = await prisma.submission.upsert({
    where: { taskId_studentId: { taskId: params.id, studentId: user.id } },
    update: payload,
    create: { ...payload, taskId: params.id, studentId: user.id },
  });
  await recordActivity(user.id);
  return { ok: true, id: submission.id };
});
