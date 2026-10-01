import { prisma } from "@/lib/db";
import { ApiError, handler, notFound } from "@/lib/api";
import { answerText, createClient, generationConfig, getAISettings } from "@/lib/ai";
import { parseJSON } from "@/lib/utils";

// Drafts feedback for the teacher to edit — never sent to the student automatically.
export const POST = handler({ role: "ADMIN" }, async ({ params }) => {
  const settings = await getAISettings();
  const client = createClient(settings);
  if (!client) throw new ApiError(503, "أضف مفتاح Gemini من صفحة المساعد الذكي أولًا");

  const s = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { task: true, student: { select: { name: true, student: { select: { birthYear: true } } } } },
  });
  if (!s) throw notFound("التسليم غير موجود");
  const age = s.student.student?.birthYear ? new Date().getFullYear() - s.student.student.birthYear : null;

  const prompt = `أنت معلّم برمجة خبير وودود في أكاديمية وَمِيض. اكتب ملاحظات تقييم لتسليم طالب${age ? ` عمره ${age} سنة` : ""}.

## المهمة: ${s.task.title}
${s.task.description.slice(0, 4000)}

## شرح الطالب
${s.content?.slice(0, 4000) || "(لا يوجد)"}

## كود الطالب
\`\`\`
${s.code?.slice(0, 8000) || "(لا يوجد)"}
\`\`\`

## روابط
${parseJSON(s.links, []).join("\n") || "(لا يوجد)"}

اكتب بالعربية وبصيغة Markdown قصيرة:
1. **ما أحسنت فيه** (نقطتان أو ثلاث)
2. **ما يحتاج تحسينًا** مع أمثلة محددة
3. **خطوتك التالية** (اقتراح واحد عملي)
في السطر الأخير اكتب فقط: الدرجة المقترحة: X/100`;

  const res = await client.models.generateContent({
    model: settings.model,
    contents: prompt,
    config: generationConfig({ ...settings, maxOutputTokens: Math.max(settings.maxOutputTokens, 1200) }),
  });
  const text = answerText(res);
  const grade = Number(text.match(/(\d{1,3})\s*\/\s*100/)?.[1]);
  return { feedback: text.replace(/\n?.*الدرجة المقترحة.*$/m, "").trim(), grade: Number.isFinite(grade) ? Math.min(grade, 100) : null };
});
