import { ApiError, handler } from "@/lib/api";
import { answerText, createClient, generationConfig, getAISettings } from "@/lib/ai";

// Sends a tiny prompt with the saved settings so the teacher can verify the key and model id.
export const POST = handler({ role: "ADMIN" }, async () => {
  const settings = await getAISettings();
  const client = createClient(settings);
  if (!client) throw new ApiError(400, "لا يوجد مفتاح API. أضفه هنا أو في متغير البيئة GEMINI_API_KEY");
  const started = Date.now();
  try {
    const res = await client.models.generateContent({
      model: settings.model,
      contents: "قل مرحبًا لطلاب أكاديمية وميض في جملة واحدة قصيرة.",
      config: generationConfig({ ...settings, maxOutputTokens: 200 }),
    });
    return { ok: true, reply: answerText(res), ms: Date.now() - started, model: settings.model };
  } catch (err) {
    throw new ApiError(502, `فشل الاتصال: ${String(err?.message ?? err).slice(0, 300)}`);
  }
});
