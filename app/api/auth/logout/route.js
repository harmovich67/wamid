import { cookies } from "next/headers";
import { handler } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export const POST = handler({ auth: false }, async () => {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return { ok: true };
});
