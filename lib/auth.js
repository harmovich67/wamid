import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";

// Verified session claims straight from the cookie (no database round trip). Lets a page start its
// data queries at the same time as the user lookup instead of waiting for it.
export const getSession = cache(async () => {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
});

// Loads the signed-in user from the DB once per request. Returns null when the session is
// missing, invalid, or the account was deactivated.
// The profile rows are fetched in the same round trip as the user instead of as a chained include.
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  // A student has a student profile and a teacher has a teacher profile, so only the matching one is fetched.
  const isAdmin = session.role === "ADMIN";
  const [user, student, teacher] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    isAdmin ? null : prisma.studentProfile.findUnique({ where: { userId: session.userId } }),
    isAdmin ? prisma.teacherProfile.findUnique({ where: { userId: session.userId } }) : null,
  ]);
  if (!user || !user.isActive) return null;
  const { passwordHash, ...safe } = user;
  return { ...safe, student, teacher };
});

// The signed-in user's id from the cookie alone, so a page can start its queries while requireStudent() verifies the account.
// Without a session it returns "" (matches no rows) and requireStudent() does the redirecting.
export async function getSessionUserId() {
  return (await getSession())?.userId ?? "";
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function requireStudent() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect("/admin");
  return user;
}
