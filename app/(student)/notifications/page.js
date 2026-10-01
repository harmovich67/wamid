import Link from "next/link";
import { Bell } from "lucide-react";
import { NotificationIcon } from "@/components/shared/NotificationIcon";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, timeAgo } from "@/lib/utils";

export const metadata = { title: "الإشعارات" };


export default async function NotificationsPage() {
  const user = await requireStudent();
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  // Opening the page marks everything as read (the list above still shows what was new).
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="الإشعارات" subtitle="دروس جديدة، مهام، ملاحظات المعلّم، وأوسمتك." />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="لا إشعارات بعد" description="سنخبرك فور فتح درس جديد أو وصول ملاحظات من معلّمك." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const body = (
              <>
                <NotificationIcon type={n.type} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{n.title}</div>
                  {n.body && <div className="mt-0.5 line-clamp-2 text-sm text-muted" dir="auto">{n.body}</div>}
                  <div className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.readAt && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" aria-label="جديد" />}
              </>
            );
            const cls = cn(
              "flex items-start gap-3 rounded-2xl border p-4 transition",
              n.readAt ? "border-line bg-surface" : "border-primary/30 bg-primary-soft/50"
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className={cn(cls, "hover:border-primary/40")}>
                {body}
              </Link>
            ) : (
              <div key={n.id} className={cls}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
