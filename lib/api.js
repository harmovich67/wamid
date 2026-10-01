import "server-only";
import { ZodError } from "zod";
import { getCurrentUser } from "./auth";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg = "طلب غير صالح") => new ApiError(400, msg);
export const notFound = (msg = "غير موجود") => new ApiError(404, msg);
export const forbidden = (msg = "لا تملك صلاحية لهذا الإجراء") => new ApiError(403, msg);

// Blocks cross-site state-changing requests (defense in depth on top of SameSite cookies).
function checkOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw forbidden("مصدر الطلب غير صالح");
  }
  if (originHost !== host) throw forbidden("مصدر الطلب غير مسموح");
}

/**
 * Wraps a route handler with auth, role check, origin check and error handling.
 *   export const POST = handler({ role: "ADMIN" }, async ({ req, user, params }) => {...})
 * Returning a plain object sends it as JSON; returning a Response sends it as-is.
 */
export function handler(options, fn) {
  const { role, auth = true } = options;
  return async (req, ctx) => {
    try {
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) checkOrigin(req);
      let user = null;
      if (auth) {
        user = await getCurrentUser();
        if (!user) throw new ApiError(401, "يجب تسجيل الدخول أولًا");
        if (role && user.role !== role) throw forbidden();
      }
      const params = ctx?.params ? await ctx.params : {};
      const result = await fn({ req, user, params });
      if (result instanceof Response) return result;
      return Response.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export async function parseBody(req, schema) {
  let data;
  try {
    data = await req.json();
  } catch {
    throw badRequest("صيغة البيانات غير صحيحة");
  }
  return schema.parse(data);
}

function errorResponse(err) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path?.join(".");
    return Response.json(
      { error: issue?.message || "بيانات غير صالحة", field, issues: err.issues },
      { status: 400 }
    );
  }
  if (err?.code === "P2002") {
    return Response.json({ error: "هذه القيمة مستخدمة مسبقًا" }, { status: 409 });
  }
  if (err?.code === "P2025") {
    return Response.json({ error: "العنصر غير موجود" }, { status: 404 });
  }
  console.error("[api]", err);
  return Response.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
}
