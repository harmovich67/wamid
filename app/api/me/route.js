import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ApiError, handler, parseBody } from "@/lib/api";
import { profileSchema } from "@/lib/validators";

export const GET = handler({}, async ({ user }) => ({ user }));

// Students and teachers can update their display name, color and password.
export const PATCH = handler({}, async ({ req, user }) => {
  const data = await parseBody(req, profileSchema);
  const update = {};
  if (data.name) update.name = data.name;
  if (data.avatarColor) update.avatarColor = data.avatarColor;
  if (data.avatar !== undefined) update.avatar = data.avatar;
  if (data.newPassword) {
    const full = await prisma.user.findUnique({ where: { id: user.id } });
    const ok = await bcrypt.compare(data.currentPassword ?? "", full.passwordHash);
    if (!ok) throw new ApiError(400, "كلمة المرور الحالية غير صحيحة");
    update.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }
  await prisma.user.update({ where: { id: user.id }, data: update });
  return { ok: true };
});
