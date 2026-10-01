import { Bot } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAISettings, resolveApiKey } from "@/lib/ai";
import { getLessonAccess, canAccessTask } from "@/lib/access";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssistantChat } from "@/components/student/AssistantChat";

export const metadata = { title: "ومضة AI" };

export default async function AssistantPage({ searchParams }) {
  const { lesson: lessonId, task: taskId, mode } = await searchParams;
  const user = await requireStudent();
  const settings = await getAISettings();

  if (!settings.enabled || !user.student?.aiEnabled) {
    return <EmptyState icon={Bot} title="المساعد الذكي غير متاح" description="فعّل المعلّم المساعد لاحقًا وسيظهر هنا." />;
  }

  let context = null;
  if (typeof lessonId === "string") {
    const { entry } = await getLessonAccess(user.id, lessonId);
    if (entry?.lesson.access.open) context = { lessonId, label: `درس: ${entry.lesson.title}` };
  } else if (typeof taskId === "string") {
    const task = await canAccessTask(user.id, taskId);
    if (task) context = { taskId, label: `مهمة: ${task.title}` };
  }

  const conversations = await prisma.aIConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, updatedAt: true },
  });

  return (
    <AssistantChat
      userName={user.name.split(" ")[0]}
      initialConversations={conversations.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))}
      context={context}
      initialMode={["explain", "review", "hint", "debug"].includes(mode) ? mode : "chat"}
      configured={Boolean(resolveApiKey(settings))}
      dailyLimit={settings.dailyLimit}
    />
  );
}
