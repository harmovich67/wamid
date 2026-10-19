import { getSessionUserId, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatUnreadCount } from "@/lib/chat";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata = { title: { default: "لوحة المعلّم", template: "%s · لوحة المعلّم" } };

export default async function AdminLayout({ children }) {
  // The counters only need the user id, which the session cookie already carries: they load while the account is verified.
  const userId = await getSessionUserId();
  const [user, pending, unread, chat] = await Promise.all([
    requireAdmin(),
    prisma.submission.count({ where: { status: "SUBMITTED" } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    chatUnreadCount({ id: userId, role: "ADMIN" }),
  ]);
  return (
    <AdminShell user={{ name: user.name, username: user.username, avatarColor: user.avatarColor, avatar: user.avatar }} counts={{ pending, unread, chat }}>
      {children}
    </AdminShell>
  );
}
