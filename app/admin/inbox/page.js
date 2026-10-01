import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationIcon } from "@/components/shared/NotificationIcon";
import { cn, timeAgo } from "@/lib/utils";

export const metadata = { title: "صندوق الوارد" };

// The teacher's notifications: student replies and reactions on announcements.
export default async function AdminInbox() {
  const user = await requireAdmin();
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="صندوق الوارد" subtitle="ردود الطلاب وتفاعلاتهم على إعلاناتك." />
      {items.length === 0 ? (
        <EmptyState icon={Inbox} title="لا شيء بعد" description="عندما يرد الطلاب أو يتفاعلون مع إعلاناتك سيظهر ذلك هنا وفي الجرس." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "#"}
              className={cn("flex items-start gap-3 rounded-2xl border p-4 transition hover:border-primary/40", n.readAt ? "border-line bg-surface" : "border-primary/30 bg-primary-soft/50")}
            >
              <NotificationIcon type={n.type} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{n.title}</div>
                {n.body && <div className="mt-0.5 line-clamp-2 text-sm text-muted" dir="auto">{n.body}</div>}
                <div className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</div>
              </div>
              {!n.readAt && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
