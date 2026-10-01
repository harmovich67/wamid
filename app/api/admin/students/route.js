import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { studentCreateSchema } from "@/lib/validators";
import { PALETTE } from "@/lib/constants";

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const data = await parseBody(req, studentCreateSchema);
  const passwordHash = await bcrypt.hash(data.password, 10);
  const levelIds = data.levelIds.length
    ? (await prisma.level.findMany({ where: { id: { in: data.levelIds } }, select: { id: true } })).map((l) => l.id)
    : [];

  const user = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email ?? null,
      passwordHash,
      role: "STUDENT",
      avatarColor: data.avatarColor ?? PALETTE[Math.floor(Math.random() * PALETTE.length)],
      avatar: data.avatar ?? null,
      student: {
        create: {
          birthYear: data.birthYear ?? null,
          guardianContact: data.guardianContact ?? null,
          notes: data.notes ?? null,
          aiEnabled: data.aiEnabled ?? true,
        },
      },
      accessRules: {
        create: levelIds.map((id) => ({ resourceType: "LEVEL", resourceId: id, effect: "ALLOW" })),
      },
    },
  });
  return { ok: true, id: user.id };
});
