import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_SYSTEM_PROMPT, getAISettings, maskKey } from "@/lib/ai";
import { AISettingsForm } from "@/components/admin/AISettingsForm";
import { AIAccessPanel } from "@/components/admin/AIAccessPanel";
import { daysAgo } from "@/lib/utils";

export const metadata = { title: "المساعد الذكي" };

export default async function AdminAIPage() {
  await requireAdmin();
  const settings = await getAISettings();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = daysAgo(7);

  const [todayCount, weekCount, conversations, topUsers, students, perUser] = await Promise.all([
    prisma.aIMessage.count({ where: { role: "user", createdAt: { gte: today } } }),
    prisma.aIMessage.count({ where: { role: "user", createdAt: { gte: weekAgo } } }),
    prisma.aIConversation.count(),
    prisma.$queryRaw`
      SELECT u.name as name, COUNT(m.id) as count
      FROM AIMessage m
      JOIN AIConversation c ON c.id = m.conversationId
      JOIN User u ON u.id = c.userId
      WHERE m.role = 'user' AND m.createdAt >= ${weekAgo}
      GROUP BY u.id ORDER BY count DESC LIMIT 5`,
    prisma.user.findMany({
      where: { role: "STUDENT", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true, avatarColor: true, student: { select: { aiEnabled: true } } },
    }),
    prisma.$queryRaw`
      SELECT c.userId as userId, COUNT(m.id) as count
      FROM AIMessage m JOIN AIConversation c ON c.id = m.conversationId
      WHERE m.role = 'user' AND m.createdAt >= ${weekAgo}
      GROUP BY c.userId`,
  ]);
  const weekly = new Map(perUser.map((r) => [r.userId, Number(r.count)]));

  return (
    <div className="space-y-6">
      <AISettingsForm
        settings={{
          enabled: settings.enabled,
          model: settings.model,
          systemPrompt: settings.systemPrompt,
          dailyLimit: settings.dailyLimit,
          maxOutputTokens: settings.maxOutputTokens,
          temperature: settings.temperature,
          allowCodeReview: settings.allowCodeReview,
          allowFullSolutions: settings.allowFullSolutions,
        }}
        keyInfo={{ saved: maskKey(settings.apiKey), env: Boolean(process.env.GEMINI_API_KEY) }}
        defaultPrompt={DEFAULT_SYSTEM_PROMPT}
        usage={{
          today: todayCount,
          week: weekCount,
          conversations,
          top: topUsers.map((u) => ({ name: u.name, count: Number(u.count) })),
        }}
      />
      <AIAccessPanel
        globalEnabled={settings.enabled}
        students={students.map((s) => ({
          userId: s.id,
          name: s.name,
          username: s.username,
          avatarColor: s.avatarColor,
          aiEnabled: s.student?.aiEnabled ?? true,
          messages: weekly.get(s.id) ?? 0,
        }))}
      />
    </div>
  );
}
