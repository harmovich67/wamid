import "server-only";
import { prisma } from "./db";
import { notFound } from "./api";
import { notifyMany } from "./notify";

// Classes (study groups): a named set of students that shares access rules and announcements.

export async function listGroups() {
  // Flat parallel queries instead of a chained include.
  const [groups, members, ruleCounts] = await Promise.all([
    prisma.studyGroup.findMany({ orderBy: { name: "asc" } }),
    prisma.studyGroupMember.findMany({ select: { groupId: true, userId: true } }),
    prisma.studyGroupRule.groupBy({ by: ["groupId"], _count: { _all: true } }),
  ]);
  const rulesBy = new Map(ruleCounts.map((r) => [r.groupId, r._count._all]));
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    color: g.color,
    memberIds: members.filter((m) => m.groupId === g.id).map((m) => m.userId),
    rules: rulesBy.get(g.id) ?? 0,
  }));
}

export async function findGroup(id) {
  const group = await prisma.studyGroup.findUnique({ where: { id } });
  if (!group) throw notFound("الفصل غير موجود");
  return group;
}

/** Group ids → the active student ids in them (for announcements, analytics filters…). */
export async function groupMemberIds(groupIds) {
  if (!groupIds?.length) return [];
  const rows = await prisma.studyGroupMember.findMany({
    where: { groupId: { in: groupIds }, user: { role: "STUDENT", isActive: true } },
    select: { userId: true },
  });
  return [...new Set(rows.map((r) => r.userId))];
}

/** Replaces the member list; students who just joined are told which class they are in now. */
export async function setGroupMembers(groupId, userIds) {
  const group = await findGroup(groupId);
  const students = await prisma.user.findMany({ where: { id: { in: userIds }, role: "STUDENT" }, select: { id: true } });
  const wanted = new Set(students.map((s) => s.id));
  const current = await prisma.studyGroupMember.findMany({ where: { groupId }, select: { userId: true } });
  const had = new Set(current.map((m) => m.userId));
  const added = [...wanted].filter((id) => !had.has(id));
  const removed = [...had].filter((id) => !wanted.has(id));

  await prisma.$transaction([
    prisma.studyGroupMember.deleteMany({ where: { groupId, userId: { in: removed } } }),
    prisma.studyGroupMember.createMany({ data: added.map((userId) => ({ groupId, userId })), skipDuplicates: true }),
  ]);
  if (added.length) {
    await notifyMany(added, { type: "SYSTEM", title: `🎒 انضممت إلى فصل: ${group.name}`, body: "ستظهر لك الدروس والمهام المخصّصة لفصلك تلقائيًا.", link: "/roadmap" });
  }
  return { added: added.length, removed: removed.length, total: wanted.size };
}

/** Class names per student, for lists and reports. */
export async function groupsByStudent() {
  const rows = await prisma.studyGroupMember.findMany({ select: { userId: true, group: { select: { id: true, name: true, color: true } } } });
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.userId)) map.set(r.userId, []);
    map.get(r.userId).push(r.group);
  }
  return map;
}
