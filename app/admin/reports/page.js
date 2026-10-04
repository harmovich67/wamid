import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { listGroups } from "@/lib/groups";
import { ensureAllReportTokens, reportPath, requestOrigin } from "@/lib/reports";
import { ReportsManager } from "@/components/admin/ReportsManager";

export const metadata = { title: "تقارير أولياء الأمور" };

export default async function ReportsPage({ searchParams }) {
  await requireAdmin();
  const { group } = await searchParams;
  await ensureAllReportTokens();
  const [students, groups, origin] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT", isActive: true, ...(group ? { groupMemberships: { some: { groupId: group } } } : {}) },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        username: true,
        avatarColor: true,
        avatar: true,
        student: { select: { guardianContact: true, reportToken: true, lastReportSentAt: true } },
      },
    }),
    listGroups(),
    requestOrigin(),
  ]);

  return (
    <ReportsManager
      groupId={group ?? null}
      groups={groups.map((g) => ({ id: g.id, name: g.name, color: g.color }))}
      email={{ configured: emailConfigured(), cron: Boolean(process.env.CRON_SECRET) }}
      students={students
        .filter((s) => s.student?.reportToken)
        .map((s) => ({
          id: s.id,
          name: s.name,
          username: s.username,
          avatarColor: s.avatarColor,
          avatar: s.avatar,
          guardianContact: s.student.guardianContact,
          lastReportSentAt: s.student.lastReportSentAt?.toISOString() ?? null,
          url: `${origin}${reportPath(s.student.reportToken)}`,
        }))}
    />
  );
}
