import { RANKS } from "./constants";
import { dayKey } from "./utils";

// Pure helpers (safe for client components).

export function rankFor(xp = 0) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) index = i;
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const progress = next ? Math.round(((xp - current.min) / (next.min - current.min)) * 100) : 100;
  return { current, next, index, progress, toNext: next ? next.min - xp : 0 };
}

// Returns the streak value after activity today, given the stored profile.
export function nextStreak(profile, today = new Date()) {
  const todayKey = dayKey(today);
  if (profile.lastActiveDate === todayKey) return { streak: profile.streakDays, changed: false, todayKey };
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const streak = profile.lastActiveDate === dayKey(yesterday) ? profile.streakDays + 1 : 1;
  return { streak, changed: true, todayKey };
}

// A streak is only "alive" if the student was active today or yesterday.
export function liveStreak(profile, today = new Date()) {
  if (!profile?.lastActiveDate) return 0;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return [dayKey(today), dayKey(yesterday)].includes(profile.lastActiveDate) ? profile.streakDays : 0;
}
