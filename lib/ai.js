import "server-only";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "./db";

export const DEFAULT_SYSTEM_PROMPT = `أنت "ومضة"، المساعد التعليمي لأكاديمية وَمِيض لتعليم البرمجة.
طلابك أعمارهم بين 10 و25 سنة ومستوياتهم مختلفة.

طريقتك:
- تحدّث بالعربية الواضحة والودودة، واترك المصطلحات البرمجية والكود بالإنجليزية.
- اشرح بخطوات قصيرة وأمثلة من الحياة اليومية، ثم مثال كود صغير.
- شجّع الطالب على التفكير: اسأله سؤالًا يقوده للحل بدل إعطائه الحل مباشرة.
- عند مراجعة الكود: ابدأ بما هو جيد، ثم الأخطاء، ثم اقتراحات التحسين.
- عند تصحيح الأخطاء: اشرح سبب الخطأ وكيف يكتشفه بنفسه مستقبلًا.
- كن صبورًا ومحفّزًا ولا تسخر من أي سؤال.
- ارفض بلطف أي طلب غير تعليمي أو غير مناسب لعمر الطالب.`;

const MODE_INSTRUCTIONS = {
  chat: "",
  explain: "الطالب يطلب شرح مفهوم. اشرحه ببساطة مع تشبيه ومثال كود قصير، ثم سؤال صغير للتأكد من الفهم.",
  review: "الطالب يطلب مراجعة كوده. قيّم الصحة والوضوح والتسمية والأداء. اقترح تحسينات محددة مع مقتطفات صغيرة.",
  hint: "الطالب يطلب تلميحًا. أعطِ تلميحًا واحدًا أو اثنين يقودانه للخطوة التالية فقط، دون كتابة الحل.",
  debug: "الطالب يواجه خطأ. ساعده على فهم رسالة الخطأ وسببها، واقترح خطوات لتتبّعه وإصلاحه.",
};

export async function getAISettings() {
  return prisma.aISettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export function resolveApiKey(settings) {
  return settings.apiKey || process.env.GEMINI_API_KEY || null;
}

export function maskKey(key) {
  if (!key) return null;
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export function createClient(settings) {
  const apiKey = resolveApiKey(settings);
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function messagesToday(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.aIMessage.count({
    where: { role: "user", createdAt: { gte: start }, conversation: { userId } },
  });
}

export function buildSystemInstruction(settings, { user, mode, lesson, task }) {
  const parts = [settings.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT];
  const age = user.student?.birthYear ? new Date().getFullYear() - user.student.birthYear : null;
  parts.push(`اسم الطالب: ${user.name}${age ? `، عمره تقريبًا ${age} سنة — كيّف أسلوبك لعمره.` : "."}`);
  if (!settings.allowFullSolutions) {
    parts.push("مهم: لا تكتب الحل الكامل لأي مهمة أو واجب. قدّم تلميحات وأمثلة مشابهة فقط.");
  }
  if (!settings.allowCodeReview && mode === "review") {
    parts.push("مراجعة الكود معطّلة حاليًا من المعلّم؛ اعتذر بلطف واقترح طرح سؤال محدد بدلًا من ذلك.");
  }
  if (MODE_INSTRUCTIONS[mode]) parts.push(MODE_INSTRUCTIONS[mode]);
  if (lesson) {
    parts.push(`سياق: الطالب يدرس درس "${lesson.title}"${lesson.summary ? ` — ${lesson.summary}` : ""}. اربط إجاباتك بهذا الدرس.`);
  }
  if (task) {
    parts.push(`سياق: الطالب يعمل على مهمة "${task.title}". وصف المهمة:\n${task.description.slice(0, 2000)}`);
  }
  return parts.join("\n\n");
}

// Thinking tokens count against maxOutputTokens, so keep thinking minimal and give it headroom:
// the teacher's "max output" setting then applies to the visible answer only.
const THINKING_HEADROOM = 1024;

export function thinkingConfigFor(model) {
  if (/^gemini-2.5-flash/.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-[3-9]/.test(model)) return { thinkingLevel: "MINIMAL" };
  return undefined;
}

export function generationConfig(settings, systemInstruction) {
  const thinkingConfig = thinkingConfigFor(settings.model);
  const headroom = thinkingConfig?.thinkingLevel ? THINKING_HEADROOM : 0;
  return {
    ...(systemInstruction ? { systemInstruction } : {}),
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens + headroom,
    ...(thinkingConfig ? { thinkingConfig } : {}),
  };
}

// Visible answer text only — thought-summary parts are never shown to students.
export function answerText(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  return parts.filter((p) => !p.thought && typeof p.text === "string").map((p) => p.text).join("");
}
