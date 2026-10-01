import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, badRequest, forbidden, handler, notFound, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { isRecipient, notify, notifyAdmins } from "@/lib/announcements";

const schema = z.object({
  content: z.string().trim().min(1, "اكتب ردّك").max(1000, "الرد طويل جدًا"),
  studentId: z.string().optional(), // the teacher must say whose thread they are answering
});

// Private thread between one student and the teacher under an announcement.
export const POST = handler({}, async ({ req, user, params }) => {
  const { content, studentId } = await parseBody(req, schema);
  const announcement = await prisma.announcement.findUnique({ where: { id: params.id }, select: { id: true, title: true } });
  if (!announcement) throw notFound("الإعلان غير موجود");

  const limit = rateLimit(`reply:${user.id}`, { limit: 20, windowMs: 5 * 60 * 1000 });
  if (!limit.ok) throw new ApiError(429, "ردود كثيرة، انتظر قليلًا");

  const threadOwner = user.role === "ADMIN" ? studentId : user.id;
  if (!threadOwner) throw badRequest("حدّد الطالب");
  if (!(await isRecipient(params.id, threadOwner))) throw forbidden();

  const reply = await prisma.announcementReply.create({
    data: { announcementId: params.id, studentId: threadOwner, authorId: user.id, content },
    include: { author: { select: { id: true, name: true, avatarColor: true, role: true } } },
  });

  if (user.role === "ADMIN") {
    await notify(threadOwner, {
      type: "REPLY",
      title: `ردّ المعلّم عليك: ${announcement.title}`,
      body: content.slice(0, 180),
      link: `/announcements/${params.id}`,
    });
  } else {
    await notifyAdmins({
      type: "REPLY",
      title: `${user.name} ردّ على: ${announcement.title}`,
      body: content.slice(0, 180),
      link: `/admin/notifications/${params.id}?student=${user.id}`,
    });
  }
  return { reply: { id: reply.id, content: reply.content, createdAt: reply.createdAt, author: reply.author } };
});
