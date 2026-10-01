import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata = { title: { default: "لوحة المعلّم", template: "%s · لوحة المعلّم" } };

export default async function AdminLayout({ children }) {
  const user = await requireAdmin();
  const [pending, unread] = await Promise.all([
    prisma.submission.count({ where: { status: "SUBMITTED" } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return (
    <AdminShell user={{ name: user.name, username: user.username, avatarColor: user.avatarColor, avatar: user.avatar }} counts={{ pending, unread }}>
      {children}
    </AdminShell>
  );
}
