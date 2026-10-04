import { MessagesSquare } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getThread } from "@/lib/chat";
import { LIMITS } from "@/lib/uploads";
import { PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StudentChat } from "@/components/chat/StudentChat";

export const metadata = { title: "مراسلة المعلّم" };

export default async function ChatPage() {
  const user = await requireStudent();
  const enabled = Boolean(user.student?.chatEnabled);
  // Rendering never marks messages as read (this page is prefetched) — the client does it on view.
  const [thread, teacher] = await Promise.all([
    getThread(user.id, "STUDENT"),
    prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
      orderBy: { createdAt: "asc" },
      select: { name: true, teacher: { select: { title: true } } },
    }),
  ]);

  if (!enabled && thread.messages.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="مراسلة المعلّم" subtitle="محادثة خاصة بينك وبين معلّمك." />
        <EmptyState
          icon={MessagesSquare}
          title="المراسلة غير مفعّلة بعد"
          description="معلّمك هو من يفتح المحادثة. عندما يفعّلها سيصلك إشعار وتستطيع مراسلته وإرسال الصور والملفات."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto h-[max(26rem,calc(100dvh-11.5rem))] max-w-3xl sm:h-[max(28rem,calc(100dvh-15rem))] lg:h-[max(30rem,calc(100dvh-11rem))]">
      <StudentChat
        initial={{ ...thread, enabled }}
        teacher={{ name: teacher?.name ?? "المعلّم", title: teacher?.teacher?.title ?? null }}
        maxBytes={LIMITS.STUDENT}
      />
    </div>
  );
}
