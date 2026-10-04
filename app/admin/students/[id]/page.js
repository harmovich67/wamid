import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildStudentTree, loadGroupRules } from "@/lib/access";
import { ensureReportToken, reportPath, requestOrigin } from "@/lib/reports";
import { getCurriculum, getTaskOptions, serializeRules } from "@/lib/admin-data";
import { studentStats } from "@/lib/rewards";
import { rankFor, liveStreak } from "@/lib/gamification";
import { StudentDetail } from "@/components/admin/StudentDetail";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const u = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  return { title: u?.name ?? "طالب" };
}

export default async function StudentPage({ params }) {
  const { id } = await params;
  await requireAdmin();

  const [student, tree, stats, levels, tasks, submissions, achievements, owned, groupRules, memberships, token, origin] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      include: { student: true, accessRules: true },
    }),
    buildStudentTree(id),
    studentStats(id),
    getCurriculum(),
    getTaskOptions(),
    prisma.submission.findMany({
      where: { studentId: id },
      orderBy: { submittedAt: "desc" },
      include: { task: { select: { title: true, type: true, points: true } } },
    }),
    prisma.achievement.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId: id } }),
    loadGroupRules(id),
    prisma.studyGroupMember.findMany({ where: { userId: id }, select: { group: { select: { id: true, name: true, color: true } } } }),
    ensureReportToken(id),
    requestOrigin(),
  ]);
  if (!student) notFound();

  const courses = tree.levels.flatMap((l) =>
    l.courses
      .filter((c) => c.visible || c.completed > 0)
      .map((c) => ({ id: c.id, title: c.title, color: c.color, icon: c.icon, level: l.title, percent: c.percent, completed: c.completed, total: c.total }))
  );

  const data = {
    id: student.id,
    name: student.name,
    username: student.username,
    email: student.email ?? "",
    avatarColor: student.avatarColor,
    avatar: student.avatar,
    isActive: student.isActive,
    createdAt: student.createdAt.toISOString(),
    lastLoginAt: student.lastLoginAt?.toISOString() ?? null,
    birthYear: student.student?.birthYear ?? "",
    guardianContact: student.student?.guardianContact ?? "",
    notes: student.student?.notes ?? "",
    aiEnabled: student.student?.aiEnabled ?? true,
    codeEnabled: student.student?.codeEnabled ?? true,
    chatEnabled: student.student?.chatEnabled ?? false,
    groups: memberships.map((m) => m.group),
    reportUrl: token ? `${origin}${reportPath(token)}` : null,
    lastReportSentAt: student.student?.lastReportSentAt?.toISOString() ?? null,
    streak: liveStreak(student.student),
    rank: rankFor(stats.xp).current.title,
  };

  return (
    <StudentDetail
      student={data}
      stats={stats}
      courses={courses}
      levels={levels}
      tasks={tasks}
      rules={serializeRules(student.accessRules)}
      groupRules={groupRules.map((r) => ({ ...serializeRules([r])[0], group: r.group }))}
      submissions={submissions.map((s) => ({
        id: s.id,
        status: s.status,
        grade: s.grade,
        submittedAt: s.submittedAt.toISOString(),
        task: s.task,
      }))}
      achievements={achievements.map((a) => ({ id: a.id, title: a.title, icon: a.icon, color: a.color, criteria: a.criteria }))}
      owned={owned.map((o) => o.achievementId)}
    />
  );
}
