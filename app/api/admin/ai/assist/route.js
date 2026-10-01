import { z } from "zod";
import { ApiError, handler, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { assistText } from "@/lib/ai-author";
import { CODE_LANGUAGES } from "@/lib/constants";

const schema = z
  .object({
    text: z.string().max(30000).default(""),
    kind: z.enum(["markdown", "code"]).default("markdown"),
    action: z.string().regex(/^[a-z]{2,20}$/),
    instruction: z.string().trim().max(1000).optional().default(""),
    language: z.enum(CODE_LANGUAGES).default("python"),
    context: z.string().trim().max(500).optional().default(""),
  })
  .refine((d) => d.action !== "custom" || d.instruction.length >= 3, { message: "اكتب ما تريد من الذكاء الاصطناعي", path: ["instruction"] })
  .refine((d) => d.text.trim() || d.action === "custom", { message: "اكتب نصًا أولًا أو استخدم «اطلب ما تريد»", path: ["text"] });

// Inline writing assistant for the teacher's editors (text and code).
export const POST = handler({ role: "ADMIN" }, async ({ req, user }) => {
  const limit = rateLimit(`ai-assist:${user.id}`, { limit: 40, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) throw new ApiError(429, "طلبات كثيرة، انتظر قليلًا");
  return assistText(await parseBody(req, schema));
});
