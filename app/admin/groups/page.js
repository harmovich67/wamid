import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listGroups } from "@/lib/groups";
import { GroupsManager } from "@/components/admin/GroupsManager";

export const metadata = { title: "الفصول" };

export default async function GroupsPage() {
  await requireAdmin();
  const [groups, students] = await Promise.all([
    listGroups(),
    prisma.user.findMany({ where: { role: "STUDENT", isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, avatarColor: true, avatar: true } }),
  ]);
  return <GroupsManager groups={groups} students={students} />;
}
