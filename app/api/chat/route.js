import { z } from "zod";
import { ApiError, badRequest, handler, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { chatUnreadCount, findChatStudent, getThread, markThreadRead, sendMessage } from "@/lib/chat";

const sendSchema = z.object({
  studentId: z.string().max(40).optional(), // the teacher says whose thread; ignored for students
  content: z.string().max(4000, "الرسالة طويلة جدًا").optional().default(""),
  attachmentIds: z.array(z.string().max(40)).max(10, "10 مرفقات كحد أقصى").optional().default([]),
});

function parseDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw badRequest("تاريخ غير صالح");
  return d;
}

// GET /api/chat?studentId=&after=&before=&read=1 — a page of the thread (polled every few seconds).
export const GET = handler({}, async ({ req, user }) => {
  const url = new URL(req.url);
  let studentId = user.id;
  let enabled = Boolean(user.student?.chatEnabled);
  if (user.role === "ADMIN") {
    const student = await findChatStudent(url.searchParams.get("studentId") ?? "");
    studentId = student.id;
    enabled = student.student?.chatEnabled ?? false;
  }
  if (url.searchParams.get("read") === "1") await markThreadRead(studentId, user);
  const [thread, unread] = await Promise.all([
    getThread(studentId, user.role, { after: parseDate(url.searchParams.get("after")), before: parseDate(url.searchParams.get("before")) }),
    chatUnreadCount(user),
  ]);
  return Response.json({ ...thread, enabled, unread }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = handler({}, async ({ req, user }) => {
  const limit = rateLimit(`chat:${user.id}`, { limit: user.role === "ADMIN" ? 120 : 30, windowMs: 60 * 1000 });
  if (!limit.ok) throw new ApiError(429, "رسائل كثيرة، انتظر قليلًا");
  const data = await parseBody(req, sendSchema);
  const message = await sendMessage(user, data);
  return { message };
});
