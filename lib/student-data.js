import "server-only";
import { cache } from "react";
import { prisma } from "./db";
import { getSession, requireStudent } from "./auth";
import { buildStudentTree, getStudentTasks } from "./access";
import { getAISettings } from "./ai";
import { liveStreak, rankFor } from "./gamification";
import { chatUnreadCount } from "./chat";

// Per-request memoized loaders so the layout and the page can share the same computation.

export const getTree = cache((userId) => buildStudentTree(userId));

export const getTasks = cache((userId) => getStudentTasks(userId, getTree(userId)));

export function isPending(task) {
  return task.access.open && (!task.submission || task.submission.status === "NEEDS_REVISION");
}

// Everything the header/sidebar needs that depends only on the user id (not on the user row).
const getShellCounts = cache(async (userId) => {
  const [unread, tasks, ai, chatUnread] = await Promise.all([
    prisma.notification.count({ where: { userId, readAt: null } }),
    getTasks(userId),
    getAISettings(),
    chatUnreadCount({ id: userId, role: "STUDENT" }),
  ]);
  return { unread, pendingTasks: tasks.filter(isPending).length, ai, chatUnread };
});

export const getShellStats = cache(async (user) => {
  const { unread, pendingTasks, ai, chatUnread } = await getShellCounts(user.id);
  const xp = user.student?.xp ?? 0;
  return {
    xp,
    streak: liveStreak(user.student),
    rank: rankFor(xp),
    unread,
    pendingTasks,
    aiAvailable: ai.enabled && (user.student?.aiEnabled ?? true),
    codeEnabled: user.student?.codeEnabled ?? true,
    chatEnabled: Boolean(user.student?.chatEnabled),
    chat: chatUnread,
  };
});

const ignore = () => {};

/**
 * requireStudent() that also starts the data queries right away. The session cookie already says
 * who the user is, so the roadmap/tasks (and the shell counters) load while the user row is still
 * being checked, instead of one round trip later. The results are memoized, so the page's own
 * getTree()/getTasks()/getShellStats() calls simply pick them up.
 */
export async function requireStudentWithData({ tasks = true, shell = false } = {}) {
  const session = await getSession();
  if (session?.role === "STUDENT") {
    const id = session.userId;
    (shell ? getShellCounts(id) : tasks ? getTasks(id) : getTree(id)).catch(ignore);
  }
  return requireStudent();
}
