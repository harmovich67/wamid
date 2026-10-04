import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BroadcastForm } from "@/components/admin/BroadcastForm";
import { REACTION_EMOJIS } from "@/lib/constants";
import { listGroups } from "@/lib/groups";

export const metadata = { title: "الإعلانات" };

export default async function AdminNotificationsPage({ searchParams }) {
  await requireAdmin();
  const { group } = await searchParams;
  const [students, announcements, groups] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT", isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, avatarColor: true } }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        recipients: { select: { readAt: true } },
        reactions: { select: { emoji: true } },
        replies: { select: { studentId: true, author: { select: { role: true } } } },
      },
    }),
    listGroups(),
  ]);
  const active = new Set(students.map((s) => s.id));

  return (
    <BroadcastForm
      students={students}
      groups={groups.map((g) => ({ id: g.id, name: g.name, color: g.color, memberIds: g.memberIds.filter((id) => active.has(id)) }))}
      initialGroup={groups.some((g) => g.id === group) ? group : null}
      recent={announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        at: a.createdAt.toISOString(),
        audience: a.audience,
        count: a.recipients.length,
        read: a.recipients.filter((r) => r.readAt).length,
        reactions: REACTION_EMOJIS.map((emoji) => ({ emoji, count: a.reactions.filter((r) => r.emoji === emoji).length })).filter((r) => r.count),
        threads: new Set(a.replies.filter((r) => r.author.role === "STUDENT").map((r) => r.studentId)).size,
      }))}
    />
  );
}
