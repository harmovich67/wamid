import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurriculum, getTaskOptions } from "@/lib/admin-data";
import { rankFor } from "@/lib/gamification";
import { liveStreak } from "@/lib/gamification";
import { StudentsManager } from "@/components/admin/StudentsManager";

export const metadata = { title: "الطلاب" };

export default async function StudentsPage({ searchParams }) {
  await requireAdmin();
  const { new: openNew } = await searchParams;
  const [students, completed, levels, tasks] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      include: { student: true, _count: { select: { accessRules: true } } },
    }),
    prisma.lessonProgress.groupBy({ by: ["userId"], where: { completedAt: { not: null } }, _count: { _all: true } }),
    getCurriculum(),
    getTaskOptions(),
  ]);
  const doneBy = new Map(completed.map((c) => [c.userId, c._count._all]));

  const rows = students.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    avatarColor: s.avatarColor,
    avatar: s.avatar,
    isActive: s.isActive,
    xp: s.student?.xp ?? 0,
    rank: rankFor(s.student?.xp ?? 0).current.title,
    streak: liveStreak(s.student),
    lessonsDone: doneBy.get(s.id) ?? 0,
    rules: s._count.accessRules,
    lastLoginAt: s.lastLoginAt?.toISOString() ?? null,
  }));

  return <StudentsManager students={rows} levels={levels} tasks={tasks} openNew={openNew === "1"} />;
}
