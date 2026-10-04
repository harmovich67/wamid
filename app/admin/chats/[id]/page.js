import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getThread } from "@/lib/chat";
import { LIMITS } from "@/lib/uploads";
import { AdminChatThread } from "@/components/chat/AdminChatThread";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const u = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  return { title: u ? `محادثة ${u.name}` : "محادثة" };
}

export default async function ChatThreadPage({ params }) {
  const { id } = await params;
  await requireAdmin();
  const [student, thread] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      select: { id: true, name: true, username: true, avatarColor: true, avatar: true, lastLoginAt: true, student: { select: { chatEnabled: true } } },
    }),
    getThread(id, "ADMIN"),
  ]);
  if (!student) notFound();

  return (
    <AdminChatThread
      student={{
        id: student.id,
        name: student.name,
        username: student.username,
        avatarColor: student.avatarColor,
        avatar: student.avatar,
        lastLoginAt: student.lastLoginAt?.toISOString() ?? null,
      }}
      initial={{ ...thread, enabled: student.student?.chatEnabled ?? false }}
      maxBytes={LIMITS.ADMIN}
    />
  );
}
