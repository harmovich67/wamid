import { prisma } from "@/lib/db";
import { forbidden, handler, notFound } from "@/lib/api";

// Authors can delete their own messages; the teacher can delete anything in any thread.
export const DELETE = handler({}, async ({ user, params }) => {
  const message = await prisma.chatMessage.findUnique({ where: { id: params.id }, select: { id: true, authorId: true, studentId: true } });
  if (!message) throw notFound("الرسالة غير موجودة");
  if (user.role !== "ADMIN" && message.authorId !== user.id) throw forbidden();
  await prisma.chatMessage.delete({ where: { id: message.id } });
  return { ok: true };
});
