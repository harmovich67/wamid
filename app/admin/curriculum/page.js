import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CurriculumManager } from "@/components/admin/CurriculumManager";

export const metadata = { title: "المسار والدورات" };

export default async function CurriculumPage() {
  await requireAdmin();
  const levels = await prisma.level.findMany({
    orderBy: { order: "asc" },
    include: {
      courses: {
        orderBy: { order: "asc" },
        include: { modules: { select: { _count: { select: { lessons: true } } } } },
      },
    },
  });

  const data = levels.map((l) => ({
    id: l.id,
    title: l.title,
    subtitle: l.subtitle ?? "",
    description: l.description ?? "",
    color: l.color,
    icon: l.icon,
    courses: l.courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      icon: c.icon,
      color: c.color,
      difficulty: c.difficulty,
      isPublished: c.isPublished,
      modules: c.modules.length,
      lessons: c.modules.reduce((s, m) => s + m._count.lessons, 0),
    })),
  }));

  return <CurriculumManager levels={data} />;
}
