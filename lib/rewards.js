import "server-only";
import { prisma } from "./db";
import { notify } from "./notify";
import { nextStreak } from "./gamification";

// Server-side XP, streak and achievement bookkeeping.

export async function awardXp(userId, amount) {
  if (!amount) return;
  await prisma.studentProfile.update({ where: { userId }, data: { xp: { increment: amount } } });
}

export async function recordActivity(userId) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) return;
  const { streak, changed, todayKey } = nextStreak(profile);
  if (!changed) return;
  await prisma.studentProfile.update({
    where: { userId },
    data: { streakDays: streak, lastActiveDate: todayKey, bestStreak: Math.max(profile.bestStreak, streak) },
  });
}

export async function studentStats(userId) {
  const [profile, lessonsCompleted, tasksApproved, perfectQuizzes, courses, completedIds] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.lessonProgress.count({ where: { userId, completedAt: { not: null } } }),
    prisma.submission.count({ where: { studentId: userId, status: "APPROVED" } }),
    prisma.$queryRaw`SELECT COUNT(*) as c FROM LessonProgress WHERE userId = ${userId} AND quizTotal > 0 AND quizScore = quizTotal`,
    prisma.course.findMany({
      where: { isPublished: true },
      select: { modules: { select: { lessons: { where: { isPublished: true }, select: { id: true } } } } },
    }),
    prisma.lessonProgress.findMany({ where: { userId, completedAt: { not: null } }, select: { lessonId: true } }),
  ]);
  const doneSet = new Set(completedIds.map((p) => p.lessonId));
  const coursesCompleted = courses.filter((c) => {
    const ids = c.modules.flatMap((m) => m.lessons.map((l) => l.id));
    return ids.length > 0 && ids.every((id) => doneSet.has(id));
  }).length;
  return {
    xp: profile?.xp ?? 0,
    streak: profile?.bestStreak ?? 0,
    lessonsCompleted,
    tasksApproved,
    perfectQuizzes: Number(perfectQuizzes?.[0]?.c ?? 0),
    coursesCompleted,
  };
}

const CRITERIA_STAT = {
  LESSONS_COMPLETED: "lessonsCompleted",
  TASKS_APPROVED: "tasksApproved",
  XP_EARNED: "xp",
  STREAK_DAYS: "streak",
  COURSES_COMPLETED: "coursesCompleted",
  QUIZ_PERFECT: "perfectQuizzes",
};

async function grant(userId, achievement) {
  await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
  if (achievement.xpBonus) await awardXp(userId, achievement.xpBonus);
  await notify(userId, {
    type: "ACHIEVEMENT",
    title: `وسام جديد: ${achievement.title}`,
    body: achievement.description,
    link: "/achievements",
  });
}

/** Checks every automatic achievement and grants the ones the student just reached. */
export async function evaluateAchievements(userId) {
  const [achievements, owned] = await Promise.all([
    prisma.achievement.findMany({ where: { criteria: { not: "MANUAL" } } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);
  const ownedSet = new Set(owned.map((o) => o.achievementId));
  const candidates = achievements.filter((a) => !ownedSet.has(a.id));
  if (!candidates.length) return [];

  const earned = [];
  // XP bonuses can unlock XP achievements, so loop until nothing new is earned.
  for (let round = 0; round < 3; round++) {
    const stats = await studentStats(userId);
    const now = candidates.filter((a) => !earned.includes(a) && stats[CRITERIA_STAT[a.criteria]] >= a.threshold);
    if (!now.length) break;
    for (const a of now) {
      await grant(userId, a);
      earned.push(a);
    }
  }
  return earned.map(({ id, title, description, icon, color }) => ({ id, title, description, icon, color }));
}

export async function grantManual(userId, achievementId) {
  const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } });
  if (!achievement) return null;
  const exists = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
  });
  if (exists) return achievement;
  await grant(userId, achievement);
  return achievement;
}
