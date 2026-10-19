import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurriculum, getTaskOptions } from "@/lib/admin-data";
import { rankFor } from "@/lib/gamification";
import { liveStreak } from "@/lib/gamification";
import { listGroups } from "@/lib/groups";
import { StudentsManager } from "@/components/admin/StudentsManager";

export const metadata = { title: "الطلاب" };

export default async function StudentsPage({ searchParams }) {
  const [, { new: openNew }] = await Promise.all([requireAdmin(), searchParams]);
  const [users, profiles, ruleCounts, completed, levels, tasks, groups] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { createdAt: "desc" } }),
    prisma.studentProfile.findMany(),
    prisma.accessRule.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.lessonProgress.groupBy({ by: ["userId"], where: { completedAt: { not: null } }, _count: { _all: true } }),
    getCurriculum(),
    getTaskOptions(),
    listGroups(),
  ]);
  const profileById = new Map(profiles.map((p) => [p.userId, p]));
  const rulesBy = new Map(ruleCounts.map((r) => [r.userId, r._count._all]));
  const students = users.map((u) => ({ ...u, student: profileById.get(u.id) ?? null, _count: { accessRules: rulesBy.get(u.id) ?? 0 } }));
  const groupsOf = (id) => groups.filter((g) => g.memberIds.includes(id));
  const doneBy = new Map(completed.map((c) => [c.userId, c._count._all]));

  const rows = students.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    avatarColor: s.avatarColor,
    avatar: s.avatar,
    isActive: s.isActive,
    codeEnabled: s.student?.codeEnabled ?? true,
    xp: s.student?.xp ?? 0,
    rank: rankFor(s.student?.xp ?? 0).current.title,
    streak: liveStreak(s.student),
    lessonsDone: doneBy.get(s.id) ?? 0,
    rules: s._count.accessRules,
    groups: groupsOf(s.id).map((g) => ({ id: g.id, name: g.name, color: g.color })),
    groupRules: groupsOf(s.id).reduce((sum, g) => sum + g.rules, 0),
    lastLoginAt: s.lastLoginAt?.toISOString() ?? null,
  }));

  return <StudentsManager students={rows} levels={levels} tasks={tasks} groups={groups} openNew={openNew === "1"} />;
}
