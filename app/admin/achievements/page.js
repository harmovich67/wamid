import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AchievementsManager } from "@/components/admin/AchievementsManager";

export const metadata = { title: "الإنجازات" };

export default async function AdminAchievementsPage() {
  await requireAdmin();
  const items = await prisma.achievement.findMany({
    orderBy: [{ criteria: "asc" }, { threshold: "asc" }],
    include: { _count: { select: { users: true } } },
  });
  return (
    <AchievementsManager
      items={items.map((a) => ({
        id: a.id,
        key: a.key,
        title: a.title,
        description: a.description,
        icon: a.icon,
        color: a.color,
        criteria: a.criteria,
        threshold: a.threshold,
        xpBonus: a.xpBonus,
        earned: a._count.users,
      }))}
    />
  );
}
