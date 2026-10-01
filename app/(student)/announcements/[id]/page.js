import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, Megaphone } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { summarizeReactions } from "@/lib/announcements";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Markdown } from "@/components/lesson/Markdown";
import { ReactionBar } from "@/components/shared/ReactionBar";
import { ReplyThread } from "@/components/shared/ReplyThread";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "إعلان" };

export default async function AnnouncementPage({ params }) {
  const { id } = await params;
  const user = await requireStudent();
  const recipient = await prisma.announcementRecipient.findUnique({
    where: { announcementId_userId: { announcementId: id, userId: user.id } },
    include: {
      announcement: {
        include: {
          author: { select: { name: true } },
          reactions: { select: { emoji: true, userId: true } },
          replies: {
            where: { studentId: user.id },
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, avatarColor: true, role: true } } },
          },
        },
      },
    },
  });
  if (!recipient) notFound();
  const a = recipient.announcement;

  // Opening the announcement marks it (and its bell notifications) as read.
  await Promise.all([
    recipient.readAt ? null : prisma.announcementRecipient.update({ where: { id: recipient.id }, data: { readAt: new Date() } }),
    prisma.notification.updateMany({
      where: { userId: user.id, readAt: null, link: `/announcements/${id}` },
      data: { readAt: new Date() },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/notifications" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> الإشعارات
      </Link>

      <article className="relative overflow-hidden rounded-[2rem] border border-line bg-surface shadow-card">
        <div className="absolute -end-16 -top-16 size-48 rounded-full bg-coral/15 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <LogoMark size={44} />
            <div>
              <div className="font-semibold">{a.author.name}</div>
              <div className="text-xs text-muted">{formatDateTime(a.createdAt)}</div>
            </div>
            <span className="ms-auto flex items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1 text-xs font-medium text-coral">
              <Megaphone className="size-3.5" /> إعلان
            </span>
          </div>
          <h1 className="mt-6 text-2xl font-bold leading-snug sm:text-3xl">{a.title}</h1>
          {a.body && <Markdown className="mt-3">{a.body}</Markdown>}
          {a.link && (
            <Button href={a.link} variant="soft" className="mt-5">
              افتح <ArrowLeft className="size-4" />
            </Button>
          )}
          <div className="mt-6 border-t border-line pt-4">
            <ReactionBar announcementId={a.id} initial={summarizeReactions(a.reactions, user.id)} />
          </div>
        </div>
      </article>

      <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-semibold">ردّك على المعلّم</h2>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Lock className="size-3.5" /> خاص بينك وبين المعلّم
          </span>
        </div>
        <ReplyThread
          announcementId={a.id}
          studentId={user.id}
          viewerRole="STUDENT"
          placeholder="اكتب ردّك أو سؤالك للمعلّم…"
          initial={a.replies.map((r) => ({ id: r.id, content: r.content, createdAt: r.createdAt.toISOString(), author: r.author }))}
        />
      </section>
    </div>
  );
}
