import "server-only";
import { cache } from "react";
import { prisma } from "./db";
import { buildStudentTree, getStudentTasks } from "./access";
import { getAISettings } from "./ai";
import { liveStreak, rankFor } from "./gamification";

// Per-request memoized loaders so the layout and the page can share the same computation.

export const getTree = cache((userId) => buildStudentTree(userId));

export const getTasks = cache(async (userId) => getStudentTasks(userId, await getTree(userId)));

export function isPending(task) {
  return task.access.open && (!task.submission || task.submission.status === "NEEDS_REVISION");
}

export const getShellStats = cache(async (user) => {
  const [unread, tasks, ai] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    getTasks(user.id),
    getAISettings(),
  ]);
  const xp = user.student?.xp ?? 0;
  return {
    xp,
    streak: liveStreak(user.student),
    rank: rankFor(xp),
    unread,
    pendingTasks: tasks.filter(isPending).length,
    aiAvailable: ai.enabled && (user.student?.aiEnabled ?? true),
  };
});
