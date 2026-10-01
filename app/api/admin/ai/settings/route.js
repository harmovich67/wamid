import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { aiSettingsSchema } from "@/lib/validators";
import { getAISettings } from "@/lib/ai";

export const PUT = handler({ role: "ADMIN" }, async ({ req }) => {
  const { apiKey, ...data } = await parseBody(req, aiSettingsSchema);
  await getAISettings();
  // apiKey: undefined = keep, "" or null = remove (fall back to GEMINI_API_KEY), string = replace.
  const keyUpdate = apiKey === undefined ? {} : { apiKey: apiKey ? apiKey : null };
  await prisma.aISettings.update({ where: { id: 1 }, data: { ...data, ...keyUpdate } });
  return { ok: true };
});
