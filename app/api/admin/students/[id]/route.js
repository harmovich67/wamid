import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { studentUpdateSchema } from "@/lib/validators";

async function findStudent(id) {
  const user = await prisma.user.findFirst({ where: { id, role: "STUDENT" } });
  if (!user) throw notFound("الطالب غير موجود");
  return user;
}

export const PATCH = handler({ role: "ADMIN" }, async ({ req, params }) => {
  await findStudent(params.id);
  const data = await parseBody(req, studentUpdateSchema);
  const userData = {
    name: data.name,
    username: data.username,
    email: data.email,
    isActive: data.isActive,
    avatarColor: data.avatarColor,
    avatar: data.avatar,
  };
  if (data.password) userData.passwordHash = await bcrypt.hash(data.password, 10);

  await prisma.user.update({
    where: { id: params.id },
    data: {
      ...userData,
      student: {
        upsert: {
          create: { birthYear: data.birthYear ?? null, guardianContact: data.guardianContact ?? null, notes: data.notes ?? null, aiEnabled: data.aiEnabled ?? true },
          update: { birthYear: data.birthYear, guardianContact: data.guardianContact, notes: data.notes, aiEnabled: data.aiEnabled },
        },
      },
    },
  });
  return { ok: true };
});

export const DELETE = handler({ role: "ADMIN" }, async ({ params }) => {
  await findStudent(params.id);
  await prisma.user.delete({ where: { id: params.id } });
  return { ok: true };
});
