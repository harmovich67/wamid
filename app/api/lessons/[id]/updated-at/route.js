import { prisma } from "@/lib/db";
import { forbidden, handler } from "@/lib/api";
import { getLessonAccess } from "@/lib/access";

// Polled by the open lesson page so the student sees teacher edits without a manual refresh.
export const GET = handler({ role: "STUDENT" }, async ({ user, params }) => {
  const { entry } = await getLessonAccess(user.id, params.id);
  if (!entry?.lesson.access.open) throw forbidden("هذا الدرس غير متاح لك");
  const lesson = await prisma.lesson.findUnique({ where: { id: params.id }, select: { updatedAt: true } });
  return { updatedAt: lesson.updatedAt.toISOString() };
});
