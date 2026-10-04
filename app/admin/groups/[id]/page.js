import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurriculum, getTaskOptions, serializeRules } from "@/lib/admin-data";
import { groupsByStudent } from "@/lib/groups";
import { GroupDetail } from "@/components/admin/GroupDetail";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const g = await prisma.studyGroup.findUnique({ where: { id }, select: { name: true } });
  return { title: g?.name ?? "فصل" };
}

export default async function GroupPage({ params }) {
  const { id } = await params;
  await requireAdmin();
  const [group, students, levels, tasks, memberships] = await Promise.all([
    prisma.studyGroup.findUnique({ where: { id }, include: { members: { select: { userId: true } }, rules: true } }),
    prisma.user.findMany({ where: { role: "STUDENT", isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, username: true, avatarColor: true, avatar: true } }),
    getCurriculum(),
    getTaskOptions(),
    groupsByStudent(),
  ]);
  if (!group) notFound();

  return (
    <GroupDetail
      group={{ id: group.id, name: group.name, description: group.description, color: group.color, memberIds: group.members.map((m) => m.userId) }}
      students={students.map((s) => ({ ...s, otherGroups: (memberships.get(s.id) ?? []).filter((g) => g.id !== group.id).map((g) => g.name) }))}
      levels={levels}
      tasks={tasks}
      rules={serializeRules(group.rules)}
    />
  );
}
