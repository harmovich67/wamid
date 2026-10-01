import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ApiError, handler, parseBody } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

// Precomputed hash so unknown usernames take as long as wrong passwords (no user enumeration).
const DUMMY_HASH = "$2b$10$Psl.ZliXKAIFbNeoZ/fy8uosbNWniDyuu2YsS9Qf92y9LwQeWC1Ni";

export const POST = handler({ auth: false }, async ({ req }) => {
  const { username, password } = await parseBody(req, loginSchema);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `login:${ip}:${username}`;
  const limit = rateLimit(key, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) {
    throw new ApiError(429, `محاولات كثيرة. حاول بعد ${Math.ceil(limit.retryAfter / 60)} دقيقة`);
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
  });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new ApiError(401, "اسم المستخدم أو كلمة المرور غير صحيحة");
  if (!user.isActive) throw new ApiError(403, "هذا الحساب موقوف. تواصل مع معلّمك");

  resetRateLimit(key);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = await signSession({ userId: user.id, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());

  return { ok: true, role: user.role, redirect: user.role === "ADMIN" ? "/admin" : "/dashboard" };
});
