import { prisma } from "@/lib/db";
import { notFound, handler } from "@/lib/api";

// Polled by the open lesson page so the student sees teacher edits without a manual refresh.
// Only a timestamp leaves here (the lesson body itself is still gated by the page), so this stays a
// single indexed lookup instead of rebuilding the student's whole roadmap on every poll.
export const GET = handler({ role: "STUDENT" }, async ({ params }) => {
  const lesson = await prisma.lesson.findFirst({ where: { id: params.id, isPublished: true }, select: { updatedAt: true } });
  if (!lesson) throw notFound();
  return { updatedAt: lesson.updatedAt.toISOString() };
});
