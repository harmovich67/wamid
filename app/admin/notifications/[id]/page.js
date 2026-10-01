import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, Eye, MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/Avatar";
import { Markdown } from "@/components/lesson/Markdown";
import { ProgressBar } from "@/components/ui/Progress";
import { ReplyThread } from "@/components/shared/ReplyThread";
import { REACTION_EMOJIS } from "@/lib/constants";
import { cn, formatDateTime, formatNumber, percent, timeAgo } from "@/lib/utils";

export const metadata = { title: "تفاصيل الإعلان" };

export default async function AnnouncementDetail({ params, searchParams }) {
  const { id } = await params;
  const { student: selectedParam } = await searchParams;
  const admin = await requireAdmin();

  const a = await prisma.announcement.findUnique({
    where: { id },
    include: {
      recipients: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
      reactions: { include: { user: { select: { name: true } } } },
      replies: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true, avatarColor: true, role: true } } } },
    },
  });
  if (!a) notFound();

  // Opening the page clears the teacher's bell notifications about this announcement.
  await prisma.notification.updateMany({
    where: { userId: admin.id, readAt: null, link: { startsWith: `/admin/notifications/${id}` } },
    data: { readAt: new Date() },
  });

  const threads = new Map();
  for (const r of a.replies) {
    if (!threads.has(r.studentId)) threads.set(r.studentId, []);
    threads.get(r.studentId).push(r);
  }
  // Students with conversations first (newest activity), then everyone else.
  const people = a.recipients
    .map((r) => {
      const t = threads.get(r.userId) ?? [];
      const last = t.at(-1);
      return { ...r.user, readAt: r.readAt, messages: t.length, last, waiting: last?.author.role === "STUDENT" };
    })
    .sort((x, y) => (y.last?.createdAt ?? 0) - (x.last?.createdAt ?? 0) || x.name.localeCompare(y.name, "ar"));
  const selected = people.find((p) => p.id === selectedParam) ?? people.find((p) => p.messages) ?? people[0];
  const read = a.recipients.filter((r) => r.readAt).length;
  const byEmoji = REACTION_EMOJIS.map((emoji) => ({ emoji, names: a.reactions.filter((r) => r.emoji === emoji).map((r) => r.user.name) })).filter((r) => r.names.length);

  return (
    <div className="space-y-6">
      <Link href="/admin/notifications" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> الإعلانات
      </Link>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <article className="rounded-3xl border border-line bg-surface p-6 shadow-card">
            <div className="text-xs text-muted">{formatDateTime(a.createdAt)} · {a.audience === "ALL" ? "كل الطلاب" : "طلاب محددون"}</div>
            <h1 className="mt-2 text-2xl font-bold">{a.title}</h1>
            {a.body && <Markdown className="mt-3">{a.body}</Markdown>}
          </article>

          <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-semibold"><Eye className="size-4 text-primary" /> القراءة</span>
              <span className="text-muted">{formatNumber(read)} من {formatNumber(a.recipients.length)}</span>
            </div>
            <ProgressBar value={percent(read, a.recipients.length)} className="mt-3" />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {people.map((p) => (
                <span key={p.id} className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", p.readAt ? "bg-mint-soft text-mint" : "bg-surface-2 text-muted")}>
                  {p.readAt ? <Check className="size-3" /> : <Clock className="size-3" />} {p.name}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <div className="mb-3 font-semibold">التفاعلات</div>
            {byEmoji.length === 0 ? (
              <p className="text-sm text-muted">لا تفاعلات بعد.</p>
            ) : (
              <div className="space-y-2">
                {byEmoji.map((r) => (
                  <div key={r.emoji} className="flex items-center gap-3 rounded-2xl bg-surface-2/60 p-2.5">
                    <span className="text-2xl">{r.emoji}</span>
                    <b className="tabular-nums">{r.names.length}</b>
                    <span className="truncate text-sm text-muted">{r.names.join("، ")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="self-start overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4 font-semibold">
            <MessageCircle className="size-5 text-sky" /> ردود الطلاب
            <span className="text-xs font-normal text-muted">— كل محادثة خاصة بين الطالب وبينك</span>
          </div>
          <div className="grid md:grid-cols-[220px_1fr]">
            <nav className="scrollbar-thin max-h-[520px] overflow-y-auto border-line p-2 md:border-e">
              {people.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/notifications/${id}?student=${p.id}`}
                  scroll={false}
                  className={cn("flex items-center gap-2.5 rounded-xl p-2 transition", selected?.id === p.id ? "bg-primary-soft" : "hover:bg-surface-2")}
                >
                  <Avatar name={p.name} color={p.avatarColor} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-[11px] text-muted">{p.last ? `${p.last.content.slice(0, 30)} · ${timeAgo(p.last.createdAt)}` : "لا رسائل"}</div>
                  </div>
                  {p.waiting && <span className="size-2.5 shrink-0 rounded-full bg-coral" title="بانتظار ردّك" />}
                </Link>
              ))}
            </nav>
            <div className="p-4 sm:p-5">
              {selected ? (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <Avatar name={selected.name} color={selected.avatarColor} size={36} />
                    <div className="font-semibold">{selected.name}</div>
                  </div>
                  <ReplyThread
                    key={selected.id}
                    announcementId={id}
                    studentId={selected.id}
                    viewerRole="ADMIN"
                    placeholder={`اكتب ردّك على ${selected.name.split(" ")[0]}…`}
                    initial={(threads.get(selected.id) ?? []).map((r) => ({ id: r.id, content: r.content, createdAt: r.createdAt.toISOString(), author: r.author }))}
                  />
                </>
              ) : (
                <p className="py-10 text-center text-sm text-muted">لا يوجد مستلمون.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
