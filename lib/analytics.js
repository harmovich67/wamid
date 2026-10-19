import "server-only";
import { prisma } from "./db";
import { groupsByStudent } from "./groups";
import { dayKey, daysAgo, parseJSON } from "./utils";

// Teacher analytics: who is active, where students get stuck, which questions are hardest.

const MIN_ANSWERS = 3; // a question needs this many first attempts before its difficulty means anything

function lastActivity(s) {
  const fromStreak = s.student?.lastActiveDate ? new Date(`${s.student.lastActiveDate}T12:00:00`) : null;
  const login = s.lastLoginAt;
  if (!fromStreak) return login;
  if (!login) return fromStreak;
  return fromStreak > login ? fromStreak : login;
}

/** Per-student table (also used by the CSV export). */
export async function getStudentRows({ days = 30, groupId = null } = {}) {
  const since = daysAgo(days);
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true, ...(groupId ? { groupMemberships: { some: { groupId } } } : {}) },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      avatarColor: true,
      avatar: true,
      lastLoginAt: true,
      student: { select: { xp: true, streakDays: true, lastActiveDate: true, guardianContact: true } },
    },
  });
  const ids = students.map((s) => s.id);
  if (!ids.length) return [];

  const [lessonsAll, lessonsPeriod, quiz, approved, graded, groups] = await Promise.all([
    prisma.lessonProgress.groupBy({ by: ["userId"], where: { userId: { in: ids }, completedAt: { not: null } }, _count: { _all: true } }),
    prisma.lessonProgress.groupBy({ by: ["userId"], where: { userId: { in: ids }, completedAt: { gte: since } }, _count: { _all: true } }),
    prisma.lessonProgress.groupBy({ by: ["userId"], where: { userId: { in: ids }, quizTotal: { gt: 0 } }, _sum: { quizScore: true, quizTotal: true } }),
    prisma.submission.groupBy({ by: ["studentId"], where: { studentId: { in: ids }, status: "APPROVED" }, _count: { _all: true } }),
    prisma.submission.groupBy({ by: ["studentId"], where: { studentId: { in: ids }, grade: { not: null } }, _avg: { grade: true } }),
    groupsByStudent(),
  ]);
  const count = (rows, key = "userId") => new Map(rows.map((r) => [r[key], r._count._all]));
  const all = count(lessonsAll);
  const period = count(lessonsPeriod);
  const ok = count(approved, "studentId");
  const quizBy = new Map(quiz.map((q) => [q.userId, q._sum]));
  const gradeBy = new Map(graded.map((g) => [g.studentId, g._avg.grade]));

  return students.map((s) => {
    const q = quizBy.get(s.id);
    const last = lastActivity(s);
    return {
      id: s.id,
      name: s.name,
      username: s.username,
      avatarColor: s.avatarColor,
      avatar: s.avatar,
      guardianContact: s.student?.guardianContact ?? null,
      groups: (groups.get(s.id) ?? []).map((g) => g.name),
      xp: s.student?.xp ?? 0,
      streak: s.student?.streakDays ?? 0,
      lessons: all.get(s.id) ?? 0,
      lessonsPeriod: period.get(s.id) ?? 0,
      tasksApproved: ok.get(s.id) ?? 0,
      avgGrade: gradeBy.get(s.id) != null ? Math.round(gradeBy.get(s.id)) : null,
      quizPercent: q?.quizTotal ? Math.round((q.quizScore / q.quizTotal) * 100) : null,
      lastActive: last?.toISOString() ?? null,
    };
  });
}

export async function getAnalytics({ days = 30, groupId = null } = {}) {
  const since = daysAgo(days);
  const rows = await getStudentRows({ days, groupId });
  const ids = rows.map((r) => r.id);
  const empty = { rows, kpis: null, series: [], stuck: [], hardQuestions: [], hardLessons: [], funnels: [], inactive: [] };
  if (!ids.length) return empty;

  const [completedPeriod, submissionsPeriod, started, completed, quizByLesson, firstTries, wrongPicks, lessons] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId: { in: ids }, completedAt: { gte: since } }, select: { completedAt: true } }),
    prisma.submission.findMany({ where: { studentId: { in: ids }, submittedAt: { gte: since } }, select: { status: true, grade: true } }),
    prisma.lessonProgress.groupBy({ by: ["lessonId"], where: { userId: { in: ids } }, _count: { _all: true } }),
    prisma.lessonProgress.groupBy({ by: ["lessonId"], where: { userId: { in: ids }, completedAt: { not: null } }, _count: { _all: true } }),
    prisma.lessonProgress.groupBy({ by: ["lessonId"], where: { userId: { in: ids }, quizTotal: { gt: 0 } }, _sum: { quizScore: true, quizTotal: true }, _count: { _all: true } }),
    prisma.quizAnswer.groupBy({ by: ["questionId", "firstCorrect"], where: { userId: { in: ids } }, _count: { _all: true } }),
    prisma.quizAnswer.groupBy({ by: ["questionId", "firstAnswer"], where: { userId: { in: ids }, firstCorrect: false }, _count: { _all: true } }),
    prisma.lesson.findMany({
      where: { isPublished: true, module: { course: { isPublished: true } } },
      orderBy: [{ module: { course: { order: "asc" } } }, { module: { order: "asc" } }, { order: "asc" }],
      select: { id: true, title: true, module: { select: { course: { select: { id: true, title: true, color: true, icon: true } } } } },
    }),
  ]);

  // ── KPIs ──
  const weekAgo = daysAgo(7);
  const activeInPeriod = rows.filter((r) => r.lastActive && new Date(r.lastActive) >= since).length;
  const graded = submissionsPeriod.filter((s) => s.grade != null);
  const quizRows = rows.filter((r) => r.quizPercent != null);
  const kpis = {
    students: rows.length,
    active: activeInPeriod,
    lessons: completedPeriod.length,
    submissions: submissionsPeriod.length,
    approved: submissionsPeriod.filter((s) => s.status === "APPROVED").length,
    avgGrade: graded.length ? Math.round(graded.reduce((s, x) => s + x.grade, 0) / graded.length) : null,
    quizPercent: quizRows.length ? Math.round(quizRows.reduce((s, r) => s + r.quizPercent, 0) / quizRows.length) : null,
  };

  // ── Daily series (lessons completed) ──
  const byDay = new Map();
  for (const p of completedPeriod) byDay.set(dayKey(p.completedAt), (byDay.get(dayKey(p.completedAt)) ?? 0) + 1);
  const span = Math.min(days, 30);
  const series = Array.from({ length: span }, (_, i) => {
    const date = dayKey(daysAgo(span - 1 - i));
    return { date, value: byDay.get(date) ?? 0 };
  });

  // ── Lessons: where students stop ──
  const startedBy = new Map(started.map((s) => [s.lessonId, s._count._all]));
  const completedBy = new Map(completed.map((s) => [s.lessonId, s._count._all]));
  const lessonInfo = new Map(lessons.map((l) => [l.id, l]));

  const stuck = lessons
    .map((l) => {
      const opened = startedBy.get(l.id) ?? 0;
      const done = completedBy.get(l.id) ?? 0;
      return { id: l.id, title: l.title, course: l.module.course.title, opened, done, stuck: opened - done, rate: opened ? Math.round((done / opened) * 100) : null };
    })
    .filter((l) => l.stuck > 0)
    .sort((a, b) => b.stuck - a.stuck || a.rate - b.rate)
    .slice(0, 8);

  // Completions per lesson, in course order, for courses someone has started.
  const funnelMap = new Map();
  for (const l of lessons) {
    const c = l.module.course;
    if (!funnelMap.has(c.id)) funnelMap.set(c.id, { id: c.id, title: c.title, color: c.color, icon: c.icon, lessons: [] });
    funnelMap.get(c.id).lessons.push({ id: l.id, title: l.title, done: completedBy.get(l.id) ?? 0, opened: startedBy.get(l.id) ?? 0 });
  }
  const funnels = [...funnelMap.values()].filter((f) => f.lessons.some((l) => l.opened || l.done));

  // ── Quizzes ──
  const hardLessons = quizByLesson
    .filter((q) => q._count._all >= 2 && q._sum.quizTotal)
    .map((q) => ({ id: q.lessonId, title: lessonInfo.get(q.lessonId)?.title ?? "—", course: lessonInfo.get(q.lessonId)?.module.course.title ?? "", students: q._count._all, percent: Math.round((q._sum.quizScore / q._sum.quizTotal) * 100) }))
    .filter((l) => lessonInfo.has(l.id))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 6);

  const tries = new Map();
  for (const t of firstTries) {
    const entry = tries.get(t.questionId) ?? { right: 0, total: 0 };
    entry.total += t._count._all;
    if (t.firstCorrect) entry.right += t._count._all;
    tries.set(t.questionId, entry);
  }
  const candidates = [...tries.entries()]
    .filter(([, t]) => t.total >= MIN_ANSWERS)
    .map(([questionId, t]) => ({ questionId, ...t, percent: Math.round((t.right / t.total) * 100) }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 8);
  let hardQuestions = [];
  if (candidates.length) {
    const questions = await prisma.quizQuestion.findMany({
      where: { id: { in: candidates.map((c) => c.questionId) } },
      select: { id: true, question: true, options: true, correctIndex: true, lesson: { select: { id: true, title: true } } },
    });
    const qInfo = new Map(questions.map((q) => [q.id, q]));
    hardQuestions = candidates
      .filter((c) => qInfo.has(c.questionId))
      .map((c) => {
        const q = qInfo.get(c.questionId);
        const options = parseJSON(q.options, []);
        const wrong = wrongPicks.filter((w) => w.questionId === c.questionId).sort((a, b) => b._count._all - a._count._all)[0];
        return {
          id: q.id,
          question: q.question,
          lesson: q.lesson,
          percent: c.percent,
          answers: c.total,
          correct: options[q.correctIndex] ?? null,
          commonWrong: wrong ? { text: options[wrong.firstAnswer] ?? null, count: wrong._count._all } : null,
        };
      });
  }

  // ── Students who went quiet ──
  const inactive = rows
    .filter((r) => !r.lastActive || new Date(r.lastActive) < weekAgo)
    .sort((a, b) => (a.lastActive ?? "").localeCompare(b.lastActive ?? ""));

  return { rows, kpis, series, stuck, hardQuestions, hardLessons, funnels, inactive };
}

const CSV_HEADERS = ["الاسم", "اسم المستخدم", "الفصول", "نقاط الخبرة", "أيام متتالية", "الدروس المكتملة", "دروس الفترة", "مهام مقبولة", "متوسط الدرجات", "نتيجة الاختبارات %", "آخر نشاط", "تواصل ولي الأمر"];

function csvCell(value) {
  const s = value == null ? "" : String(value);
  // Neutralise spreadsheet formulas and quote everything that needs it.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Excel-friendly CSV (UTF-8 with BOM so Arabic opens correctly). */
export function rowsToCsv(rows) {
  const lines = [CSV_HEADERS, ...rows.map((r) => [r.name, r.username, r.groups.join(" / "), r.xp, r.streak, r.lessons, r.lessonsPeriod, r.tasksApproved, r.avgGrade, r.quizPercent, r.lastActive ? r.lastActive.slice(0, 10) : "", r.guardianContact])];
  return "﻿" + lines.map((l) => l.map(csvCell).join(",")).join("\r\n");
}
