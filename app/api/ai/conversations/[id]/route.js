import { prisma } from "@/lib/db";
import { handler, notFound } from "@/lib/api";

async function own(userId, id) {
  const conversation = await prisma.aIConversation.findFirst({ where: { id, userId } });
  if (!conversation) throw notFound("المحادثة غير موجودة");
  return conversation;
}

export const GET = handler({ role: "STUDENT" }, async ({ user, params }) => {
  const conversation = await own(user.id, params.id);
  const messages = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true },
  });
  return { conversation, messages };
});

export const DELETE = handler({ role: "STUDENT" }, async ({ user, params }) => {
  await own(user.id, params.id);
  await prisma.aIConversation.delete({ where: { id: params.id } });
  return { ok: true };
});
