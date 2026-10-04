import "server-only";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./db";
import { buildStudentTree, getStudentTasks } from "./access";
import { liveStreak, rankFor } from "./gamification";
import { dayKey, daysAgo, guardianChannels } from "./utils";
import { emailConfigured, parentReportEmail, sendEmail } from "./email";

// Parent reports: a read-only page behind a secret link (no login), shareable on WhatsApp/email.

export function newToken() {
  return randomBytes(24).toString("base64url");
}

/** Returns the student's report token, creating it (or a fresh one when regenerating). */
export async function ensureReportToken(userId, { regenerate = false } = {}) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId }, select: { reportToken: true } });
  if (!profile) return null;
  if (profile.reportToken && !regenerate) return profile.reportToken;
  const reportToken = newToken();
  await prisma.studentProfile.update({ where: { userId }, data: { reportToken } });
  return reportToken;
}

/** Gives every student without a link one (used by the reports page so links are plain anchors). */
export async function ensureAllReportTokens() {
  const missing = await prisma.studentProfile.findMany({ where: { reportToken: null }, select: { userId: true } });
  for (const { userId } of missing) {
    await prisma.studentProfile.update({ where: { userId }, data: { reportToken: newToken() } });
  }
}

/** Public base URL: APP_URL, else Vercel's production domain, else the current request's host. */
export function appOrigin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const host = req?.headers?.get("x-forwarded-host") || req?.headers?.get("host");
  if (host) return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  return "";
}

export const reportPath = (token) => `/report/${token}`;

/** appOrigin() for server components (reads the incoming request headers). */
export async function requestOrigin() {
  return appOrigin({ headers: await headers() });
}

/** Everything the parent report shows, for the last `days` days. */
export async function buildReport(userId, days = 7) {
  const since = daysAgo(days);
  const [user, tree, periodLessons, totals, submissions, achievements, groups] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        avatarColor: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
        student: { select: { xp: true, streakDays: true, bestStreak: true, lastActiveDate: true } },
      },
    }),
    buildStudentTree(userId),
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { gte: since } },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, quizScore: true, quizTotal: true, lesson: { select: { title: true } } },
    }),
    Promise.all([
      prisma.lessonProgress.count({ where: { userId, completedAt: { not: null } } }),
      prisma.submission.count({ where: { studentId: userId, status: "APPROVED" } }),
      prisma.submission.aggregate({ where: { studentId: userId, grade: { not: null } }, _avg: { grade: true } }),
      prisma.lessonProgress.aggregate({ where: { userId, quizTotal: { gt: 0 } }, _sum: { quizScore: true, quizTotal: true } }),
    ]),
    prisma.submission.findMany({
      where: { studentId: userId, OR: [{ submittedAt: { gte: since } }, { reviewedAt: { gte: since } }] },
      orderBy: { submittedAt: "desc" },
      select: { status: true, grade: true, feedback: true, submittedAt: true, reviewedAt: true, task: { select: { title: true, type: true } } },
    }),
    prisma.userAchievement.findMany({
      where: { userId, earnedAt: { gte: since } },
      orderBy: { earnedAt: "desc" },
      select: { earnedAt: true, achievement: { select: { title: true, icon: true, color: true } } },
    }),
    prisma.studyGroupMember.findMany({ where: { userId }, select: { group: { select: { name: true } } } }),
  ]);
  if (!user) return null;

  const tasks = await getStudentTasks(userId, tree);
  const now = new Date();
  const pending = tasks.filter((t) => t.access.open && (!t.submission || t.submission.status === "NEEDS_REVISION"));
  const overdue = pending.filter((t) => t.deadline && t.deadline < now);

  const activeDays = new Set([
    ...periodLessons.map((p) => dayKey(p.completedAt)),
    ...submissions.filter((s) => s.submittedAt >= since).map((s) => dayKey(s.submittedAt)),
  ]);

  const [lessonsTotal, tasksApproved, gradeAvg, quizSums] = totals;
  const xp = user.student?.xp ?? 0;
  const quizzes = periodLessons.filter((p) => p.quizTotal);

  return {
    days,
    from: since.toISOString(),
    to: now.toISOString(),
    student: {
      name: user.name,
      avatarColor: user.avatarColor,
      avatar: user.avatar,
      joinedAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      lastActiveDate: user.student?.lastActiveDate ?? null,
      groups: groups.map((g) => g.group.name),
    },
    rank: rankFor(xp).current.title,
    xp,
    streak: liveStreak(user.student),
    bestStreak: user.student?.bestStreak ?? 0,
    period: {
      lessons: periodLessons.map((p) => ({
        title: p.lesson.title,
        at: p.completedAt.toISOString(),
        quiz: p.quizTotal ? { score: p.quizScore, total: p.quizTotal } : null,
      })),
      quizPercent: quizzes.length
        ? Math.round((quizzes.reduce((s, p) => s + p.quizScore, 0) / quizzes.reduce((s, p) => s + p.quizTotal, 0)) * 100)
        : null,
      submissions: submissions.map((s) => ({
        title: s.task.title,
        type: s.task.type,
        status: s.status,
        grade: s.grade,
        feedback: s.feedback ? s.feedback.slice(0, 400) : null,
        at: (s.reviewedAt ?? s.submittedAt).toISOString(),
      })),
      achievements: achievements.map((a) => ({ ...a.achievement, at: a.earnedAt.toISOString() })),
      activeDays: activeDays.size,
    },
    totals: {
      lessons: lessonsTotal,
      tasksApproved,
      avgGrade: gradeAvg._avg.grade != null ? Math.round(gradeAvg._avg.grade) : null,
      quizPercent: quizSums._sum.quizTotal ? Math.round((quizSums._sum.quizScore / quizSums._sum.quizTotal) * 100) : null,
    },
    pending: pending.slice(0, 8).map((t) => ({ title: t.title, deadline: t.deadline?.toISOString() ?? null, overdue: Boolean(t.deadline && t.deadline < now) })),
    overdue: overdue.length,
    courses: tree.levels
      .flatMap((l) => l.courses)
      .filter((c) => c.visible || c.completed > 0)
      .map((c) => ({ title: c.title, color: c.color, icon: c.icon, percent: c.percent, completed: c.completed, total: c.total })),
  };
}

/**
 * Emails the weekly report to every active student's guardian that has an email address.
 * Used by the Vercel cron (api/cron/parent-reports) and the "send now" button.
 */
export async function sendWeeklyReports(origin) {
  if (!emailConfigured()) return { sent: 0, skipped: 0, failed: 0, configured: false };
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true },
    select: { id: true, student: { select: { guardianContact: true } } },
  });
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const s of students) {
    const { email } = guardianChannels(s.student?.guardianContact);
    if (!email) {
      skipped++;
      continue;
    }
    const token = await ensureReportToken(s.id);
    const report = await buildReport(s.id, 7);
    if (!token || !report) {
      skipped++;
      continue;
    }
    const res = await sendEmail({ to: email, ...parentReportEmail(report, `${origin}${reportPath(token)}`) });
    if (res.ok) {
      sent++;
      await prisma.studentProfile.update({ where: { userId: s.id }, data: { lastReportSentAt: new Date() } });
    } else {
      failed++;
    }
  }
  return { sent, skipped, failed, configured: true };
}
