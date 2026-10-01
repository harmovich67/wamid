import { prisma } from "@/lib/db";
import { ApiError, forbidden, handler, notFound, parseBody } from "@/lib/api";
import { aiChatSchema } from "@/lib/validators";
import { answerText, buildSystemInstruction, createClient, generationConfig, getAISettings, messagesToday } from "@/lib/ai";
import { canAccessTask, getLessonAccess } from "@/lib/access";
import { rateLimit } from "@/lib/rate-limit";

const HISTORY_LIMIT = 20;

export const POST = handler({ role: "STUDENT" }, async ({ req, user }) => {
  const body = await parseBody(req, aiChatSchema);
  const settings = await getAISettings();
  if (!settings.enabled) throw forbidden("المساعد الذكي متوقف حاليًا");
  if (user.student && !user.student.aiEnabled) throw forbidden("المساعد الذكي غير مفعّل لحسابك");

  const burst = rateLimit(`ai:${user.id}`, { limit: 6, windowMs: 60 * 1000 });
  if (!burst.ok) throw new ApiError(429, "رسائل سريعة جدًا — خذ نفسًا وحاول بعد لحظات");
  if (settings.dailyLimit > 0 && (await messagesToday(user.id)) >= settings.dailyLimit) {
    throw new ApiError(429, `وصلت للحد اليومي (${settings.dailyLimit} رسالة). عُد غدًا!`);
  }

  const client = createClient(settings);
  if (!client) throw new ApiError(503, "لم يضبط المعلّم مفتاح Gemini بعد");

  // Conversation (owned by this student) and optional lesson/task context.
  let conversation = null;
  if (body.conversationId) {
    conversation = await prisma.aIConversation.findFirst({ where: { id: body.conversationId, userId: user.id } });
    if (!conversation) throw notFound("المحادثة غير موجودة");
  }
  const context = body.context ?? (conversation?.context ? JSON.parse(conversation.context) : {});
  let lesson = null;
  let task = null;
  if (context?.lessonId) {
    const { entry } = await getLessonAccess(user.id, context.lessonId);
    if (entry?.lesson.access.open) lesson = await prisma.lesson.findUnique({ where: { id: context.lessonId }, select: { title: true, summary: true } });
  }
  if (context?.taskId) {
    const t = await canAccessTask(user.id, context.taskId);
    if (t) task = { title: t.title, description: t.description };
  }

  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        title: body.message.slice(0, 60),
        context: lesson || task ? JSON.stringify({ lessonId: lesson ? context.lessonId : undefined, taskId: task ? context.taskId : undefined }) : null,
      },
    });
  }

  const history = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  await prisma.aIMessage.create({ data: { conversationId: conversation.id, role: "user", content: body.message } });

  const contents = [
    ...history.reverse().map((m) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: body.message }] },
  ];
  const systemInstruction = buildSystemInstruction(settings, { user, mode: body.mode, lesson, task });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        const response = await client.models.generateContentStream({
          model: settings.model,
          contents,
          config: generationConfig(settings, systemInstruction),
        });
        for await (const chunk of response) {
          const text = answerText(chunk);
          if (text) {
            full += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        if (!full) {
          full = "لم أستطع توليد إجابة هذه المرة، جرّب إعادة صياغة سؤالك 🙏";
          controller.enqueue(encoder.encode(full));
        }
      } catch (err) {
        console.error("[ai] generation failed:", err?.message ?? err);
        const msg = `${full ? "\n\n" : ""}⚠️ تعذّر الوصول إلى المساعد الآن. حاول مرة أخرى بعد قليل.`;
        full += msg;
        controller.enqueue(encoder.encode(msg));
      }
      await prisma.aIMessage.create({ data: { conversationId: conversation.id, role: "model", content: full } }).catch(() => {});
      await prisma.aIConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }).catch(() => {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Conversation-Id": conversation.id,
    },
  });
});
