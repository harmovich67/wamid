import { handler } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api";
import { saveUpload } from "@/lib/uploads";

export const POST = handler({}, async ({ req, user }) => {
  if (user.role !== "ADMIN") {
    const limit = rateLimit(`upload:${user.id}`, { limit: 30, windowMs: 60 * 60 * 1000 });
    if (!limit.ok) throw new ApiError(429, "رفعت ملفات كثيرة، حاول لاحقًا");
  }
  const form = await req.formData();
  return saveUpload(form.get("file"), user);
});
