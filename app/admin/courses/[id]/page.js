import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CourseEditor } from "@/components/admin/CourseEditor";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const c = await prisma.course.findUnique({ where: { id }, select: { title: true } });
  return { title: c?.title ?? "دورة" };
}

export default async function AdminCoursePage({ params }) {
  const { id } = await params;
  await requireAdmin();
  const [course, levels] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, isPublished: true, xpReward: true, durationMin: true, _count: { select: { quiz: true, progress: { where: { completedAt: { not: null } } } } } },
            },
          },
        },
      },
    }),
    prisma.level.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!course) notFound();

  return (
    <CourseEditor
      levels={levels}
      course={{
        id: course.id,
        levelId: course.levelId,
        title: course.title,
        description: course.description ?? "",
        icon: course.icon,
        color: course.color,
        difficulty: course.difficulty,
        sequential: course.sequential,
        isPublished: course.isPublished,
      }}
      modules={course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          isPublished: l.isPublished,
          xpReward: l.xpReward,
          durationMin: l.durationMin,
          quiz: l._count.quiz,
          completions: l._count.progress,
        })),
      }))}
    />
  );
}
