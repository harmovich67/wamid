import "server-only";
import { prisma } from "./db";
import { ApiError, badRequest, forbidden, notFound } from "./api";
import { adminIds } from "./announcements";
import { notifyConversation, notifyMany } from "./notify";
import { parseJSON } from "./utils";

// Each student has exactly one private thread with the teacher (thread id = studentId).
// The teacher decides per student whether the chat is open (StudentProfile.chatEnabled).

export const PAGE_SIZE = 40;

const SELECT = {
  id: true,
  content: true,
  attachments: true,
  fromStudent: true,
  readAt: true,
  createdAt: true,
  author: { select: { id: true, name: true, role: true } },
};

export function threadLink(studentId, role) {
  return role === "ADMIN" ? `/admin/chats/${studentId}` : "/chat";
}

export function serializeMessage(m) {
  return {
    id: m.id,
    content: m.content,
    attachments: parseJSON(m.attachments, []),
    fromStudent: m.fromStudent,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    author: m.author,
  };
}

function preview(content, attachments) {
  if (content) return content.length > 160 ? `${content.slice(0, 160)}…` : content;
  if (!attachments.length) return "";
  const images = attachments.filter((a) => a.mime?.startsWith("image/")).length;
  if (images === attachments.length) return images > 1 ? `📷 ${images} صور` : "📷 صورة";
  return attachments.length > 1 ? `📎 ${attachments.length} ملفات` : `📎 ${attachments[0].name}`;
}

export function previewOf(m) {
  return preview(m.content, parseJSON(m.attachments, []));
}

/**
 * Loads a page of the thread.
 *  - `after`: everything newer (used by polling), oldest first.
 *  - `before`: the page just older than that point (infinite scroll up).
 * `seenAt` is the newest of the viewer's own messages that the other side has read (read receipts).
 */
export async function getThread(studentId, viewerRole, { after, before } = {}) {
  const mine = viewerRole === "STUDENT";
  const [rows, seen] = await Promise.all([
    after
      ? prisma.chatMessage.findMany({ where: { studentId, createdAt: { gte: after } }, orderBy: { createdAt: "asc" }, take: 200, select: SELECT })
      : prisma.chatMessage
          .findMany({
            where: { studentId, ...(before ? { createdAt: { lt: before } } : {}) },
            orderBy: { createdAt: "desc" },
            take: PAGE_SIZE + 1,
            select: SELECT,
          })
          .then((list) => list.reverse()),
    prisma.chatMessage.findFirst({
      where: { studentId, fromStudent: mine, readAt: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  const hasMore = !after && rows.length > PAGE_SIZE;
  const messages = hasMore ? rows.slice(1) : rows;
  return { messages: messages.map(serializeMessage), hasMore, seenAt: seen?.createdAt.toISOString() ?? null };
}

/** Marks the other side's messages as read, plus the matching bell notification. */
export async function markThreadRead(studentId, viewer) {
  const now = new Date();
  const [res] = await Promise.all([
    prisma.chatMessage.updateMany({ where: { studentId, fromStudent: viewer.role !== "STUDENT", readAt: null }, data: { readAt: now } }),
    prisma.notification.updateMany({
      where: { userId: viewer.id, type: "MESSAGE", link: threadLink(studentId, viewer.role), readAt: null },
      data: { readAt: now },
    }),
  ]);
  return res.count;
}

export async function chatUnreadCount(user) {
  if (user.role === "ADMIN") return prisma.chatMessage.count({ where: { fromStudent: true, readAt: null } });
  return prisma.chatMessage.count({ where: { studentId: user.id, fromStudent: false, readAt: null } });
}

export async function findChatStudent(studentId) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT" },
    select: { id: true, name: true, username: true, avatarColor: true, avatar: true, isActive: true, lastLoginAt: true, student: { select: { chatEnabled: true } } },
  });
  if (!student) throw notFound("الطالب غير موجود");
  return student;
}

async function resolveAttachments(ids, user) {
  if (!ids.length) return [];
  const uploads = await prisma.upload.findMany({ where: { id: { in: ids }, ownerId: user.id } });
  if (uploads.length !== new Set(ids).size) throw badRequest("أحد المرفقات غير صالح");
  const byId = new Map(uploads.map((u) => [u.id, u]));
  return ids.map((id) => {
    const u = byId.get(id);
    return { id: u.id, url: `/api/files/${u.id}`, name: u.name, size: u.size, mime: u.mime };
  });
}

export async function sendMessage(user, { studentId, content, attachmentIds }) {
  const isStudent = user.role === "STUDENT";
  const threadId = isStudent ? user.id : studentId;
  if (!threadId) throw badRequest("حدّد الطالب");

  if (isStudent) {
    if (!user.student?.chatEnabled) throw forbidden("الدردشة مع المعلّم مغلقة حاليًا");
  } else {
    await findChatStudent(threadId);
  }

  const text = content?.trim() || null;
  const attachments = await resolveAttachments(attachmentIds ?? [], user);
  if (!text && !attachments.length) throw new ApiError(400, "اكتب رسالة أو أرفق ملفًا");

  const message = await prisma.chatMessage.create({
    data: {
      studentId: threadId,
      authorId: user.id,
      fromStudent: isStudent,
      content: text,
      attachments: attachments.length ? JSON.stringify(attachments) : null,
    },
    select: SELECT,
  });

  const body = preview(text, attachments);
  if (isStudent) {
    await notifyConversation(await adminIds(), { title: `💬 ${user.name}`, body, link: threadLink(threadId, "ADMIN"), tag: `chat-${threadId}` });
  } else {
    await notifyConversation([threadId], { title: "💬 رسالة من المعلّم", body, link: threadLink(threadId, "STUDENT"), tag: "chat" });
  }
  return serializeMessage(message);
}

/** Opens or closes the chat for some (or all) students; students who just gained access are told. */
export async function setChatAccess({ userIds, all, enabled }) {
  const scope = all ? { user: { role: "STUDENT" } } : { userId: { in: userIds ?? [] } };
  const changing = await prisma.studentProfile.findMany({
    where: { ...scope, chatEnabled: !enabled, user: { role: "STUDENT", isActive: true } },
    select: { userId: true },
  });
  const res = await prisma.studentProfile.updateMany({ where: scope, data: { chatEnabled: enabled } });
  if (enabled && changing.length) {
    await notifyMany(
      changing.map((s) => s.userId),
      { type: "MESSAGE", title: "🔓 فتح المعلّم الدردشة معك", body: "يمكنك الآن مراسلة معلّمك وإرسال الصور والملفات.", link: "/chat" }
    );
  }
  return res.count;
}

/** Inbox for the teacher: every student, with their latest message and unread count. */
export async function getChatThreads() {
  const [students, latest, unread] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true, avatarColor: true, avatar: true, isActive: true, student: { select: { chatEnabled: true } } },
    }),
    prisma.chatMessage.groupBy({ by: ["studentId"], _max: { createdAt: true } }),
    prisma.chatMessage.groupBy({ by: ["studentId"], where: { fromStudent: true, readAt: null }, _count: { _all: true } }),
  ]);
  const lastRows = latest.length
    ? await prisma.chatMessage.findMany({
        where: { OR: latest.map((l) => ({ studentId: l.studentId, createdAt: l._max.createdAt })) },
        select: { studentId: true, content: true, attachments: true, fromStudent: true, createdAt: true },
      })
    : [];
  const lastBy = new Map(lastRows.map((m) => [m.studentId, m]));
  const unreadBy = new Map(unread.map((u) => [u.studentId, u._count._all]));

  return students
    .map((s) => {
      const last = lastBy.get(s.id);
      return {
        id: s.id,
        name: s.name,
        username: s.username,
        avatarColor: s.avatarColor,
        avatar: s.avatar,
        isActive: s.isActive,
        chatEnabled: s.student?.chatEnabled ?? false,
        unread: unreadBy.get(s.id) ?? 0,
        last: last ? { text: previewOf(last), fromStudent: last.fromStudent, createdAt: last.createdAt.toISOString() } : null,
      };
    })
    .sort((a, b) => (b.last?.createdAt ?? "").localeCompare(a.last?.createdAt ?? ""));
}
