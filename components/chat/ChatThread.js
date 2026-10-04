"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowDown,
  Check,
  CheckCheck,
  ChevronUp,
  Clock,
  CloudUpload,
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileText,
  FileVideo,
  ImagePlus,
  LoaderCircle,
  Lock,
  Paperclip,
  RotateCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { api, compressImage, uid, uploadWithProgress } from "@/lib/client";
import { playChime } from "@/lib/sound";
import { publishCounts, refreshFeed } from "@/components/layout/NotificationBell";
import { useMounted } from "@/components/ui/useMounted";
import { cn, formatBytes, formatDate } from "@/lib/utils";

const POLL_MS = 3500;
const MAX_FILES = 10;
const STUDENT_ACCEPT =
  "image/*,.pdf,.txt,.md,.zip,.py,.js,.jsx,.ts,.html,.css,.json,.cpp,.c,.h,.java,.sql,.csv,.docx,.xlsx,.pptx,.mp3,.m4a,.wav,.mp4,.webm,.mov";
const timeFmt = new Intl.DateTimeFormat("ar-u-nu-latn", { hour: "numeric", minute: "2-digit" });
const URL_RE = /(https?:\/\/[^\s<>"']+)/g;
// Images the browser can draw inline; anything else (e.g. HEIC) is shown as a downloadable file.
const INLINE_IMAGE = /^image\/(png|jpe?g|gif|webp|avif)$/;
const CODE_EXT = new Set(["py", "js", "jsx", "ts", "html", "css", "json", "cpp", "c", "h", "java", "sql"]);

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "اليوم";
  if (sameDay(d, yesterday)) return "أمس";
  return formatDate(d);
}

function mergeMessages(list, incoming) {
  if (!incoming.length) return list;
  const byId = new Map(list.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function fileIcon({ mime = "", name = "" }) {
  const ext = name.split(".").pop().toLowerCase();
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.startsWith("video/")) return FileVideo;
  if (ext === "zip" || ext === "rar") return FileArchive;
  if (CODE_EXT.has(ext)) return FileCode;
  if (["pdf", "txt", "md", "docx", "xlsx", "pptx", "csv"].includes(ext)) return FileText;
  return File;
}

function Linkified({ text }) {
  return text.split(URL_RE).map((part, i) =>
    i % 2 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-2">
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

function Attachments({ items, mine, onImageLoad, onOpenImage }) {
  const images = items.filter((a) => INLINE_IMAGE.test(a.mime ?? ""));
  const media = items.filter((a) => a.mime?.startsWith("video/") || a.mime?.startsWith("audio/"));
  const files = items.filter((a) => !images.includes(a) && !media.includes(a));
  return (
    <div className="space-y-1.5">
      {images.length > 0 && (
        <div className={cn("grid gap-1", images.length > 1 && "grid-cols-2")}>
          {images.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenImage(a);
              }}
              className="group/img relative block overflow-hidden rounded-2xl bg-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.name}
                loading="lazy"
                decoding="async"
                onLoad={onImageLoad}
                className={cn("w-full object-cover transition group-hover/img:brightness-95", images.length > 1 ? "aspect-square" : "max-h-80 min-h-24")}
              />
            </button>
          ))}
        </div>
      )}
      {media.map((a) =>
        a.mime.startsWith("video/") ? (
          <video key={a.id} src={a.url} controls preload="metadata" className="max-h-80 w-full rounded-2xl bg-black" />
        ) : (
          <audio key={a.id} src={a.url} controls preload="metadata" className="w-full min-w-56" />
        )
      )}
      {files.map((a) => {
        const Icon = fileIcon(a);
        return (
          <a
            key={a.id}
            href={a.url}
            download={a.name}
            className={cn(
              "flex items-center gap-3 rounded-2xl p-2.5 transition",
              mine ? "bg-white/15 hover:bg-white/25" : "bg-surface hover:bg-bg"
            )}
          >
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", mine ? "bg-white/20" : "bg-primary-soft text-primary")}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium" dir="auto">
                {a.name}
              </span>
              <span className={cn("block text-xs", mine ? "text-white/70" : "text-muted")}>{formatBytes(a.size)}</span>
            </span>
            <Download className="size-4 shrink-0 opacity-70" />
          </a>
        );
      })}
    </div>
  );
}

function ImageViewer({ image, onClose }) {
  const mounted = useMounted();
  useEffect(() => {
    if (!image) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [image, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {image && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-[#0c0a18]/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="flex items-center gap-2 p-3 text-white" onClick={(e) => e.stopPropagation()}>
            <span className="min-w-0 flex-1 truncate text-sm" dir="auto">
              {image.name}
            </span>
            <a href={image.url} download={image.name} className="grid size-10 place-items-center rounded-xl hover:bg-white/10" aria-label="تحميل">
              <Download className="size-5" />
            </a>
            <button onClick={onClose} className="grid size-10 place-items-center rounded-xl hover:bg-white/10" aria-label="إغلاق">
              <X className="size-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3 pt-0">
            <motion.img
              src={image.url}
              alt={image.name}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="max-h-full max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Private chat thread between one student and the teacher.
 *  - viewerRole decides which side is "mine".
 *  - Polls for new messages every few seconds while visible and marks the other side's messages read.
 *  - Files are uploaded first (with progress), then sent as attachment ids.
 */
export function ChatThread({ studentId, viewerRole, initial, header, emptyHint, maxBytes, peerAvatar, onActivity }) {
  const isStudent = viewerRole === "STUDENT";
  const mounted = useMounted();
  const [messages, setMessages] = useState(initial.messages);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [seenAt, setSeenAt] = useState(initial.seenAt);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [outbox, setOutbox] = useState([]);
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [newBelow, setNewBelow] = useState(0);
  const [selected, setSelected] = useState(null);
  const [viewer, setViewer] = useState(null);

  const scroller = useRef(null);
  const input = useRef(null);
  const fileInput = useRef(null);
  const imageInput = useRef(null);
  const atBottom = useRef(true);
  const restore = useRef(null); // scrollHeight before prepending older messages
  const aborts = useRef({});
  const lastAt = useRef(initial.messages.at(-1)?.createdAt ?? null);
  const known = useRef(new Set(initial.messages.map((m) => m.id))); // ids already shown (no chime for them)
  const polling = useRef(false);
  const unreadRef = useRef(null);

  const canSend = !isStudent || enabled;
  const qs = isStudent ? "" : `studentId=${encodeURIComponent(studentId)}&`;
  const isMine = useCallback((m) => (isStudent ? m.fromStudent : !m.fromStudent), [isStudent]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setNewBelow(0);
  }, []);

  // ── Polling ─────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const visible = document.visibilityState === "visible";
      const after = lastAt.current ? `after=${encodeURIComponent(lastAt.current)}&` : "";
      const res = await fetch(`/api/chat?${qs}${after}${visible ? "read=1" : ""}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      // Reading the thread also read its bell notification: let the bell catch up now.
      if (visible && data.unread !== unreadRef.current) refreshFeed();
      unreadRef.current = data.unread;
      setSeenAt(data.seenAt);
      setEnabled(data.enabled);
      publishCounts({ chat: data.unread });
      if (data.messages.length) {
        lastAt.current = data.messages.at(-1).createdAt;
        const incoming = data.messages.filter((m) => !known.current.has(m.id) && !isMine(m));
        data.messages.forEach((m) => known.current.add(m.id));
        if (incoming.length) {
          playChime();
          onActivity?.();
          if (!atBottom.current) setNewBelow((n) => n + incoming.length);
        }
        setMessages((list) => mergeMessages(list, data.messages));
      }
    } catch {
    } finally {
      polling.current = false;
    }
  }, [qs, isMine, onActivity]);

  useEffect(() => {
    // First poll right away: marks messages read and catches anything newer than the cached render.
    poll();
    const timer = setInterval(() => document.visibilityState === "visible" && poll(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  // ── Scrolling ───────────────────────────────────────────
  // Starts at the bottom (atBottom is true on mount) and follows new messages unless the user scrolled up.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (restore.current !== null) {
      el.scrollTop += el.scrollHeight - restore.current;
      restore.current = null;
      return;
    }
    if (atBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, outbox]);

  function onScroll() {
    const el = scroller.current;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottom.current && newBelow) setNewBelow(0);
  }

  const onImageLoad = useCallback(() => {
    if (atBottom.current) scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, []);

  async function loadOlder() {
    if (loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    try {
      const data = await api(`/api/chat?${qs}before=${encodeURIComponent(messages[0].createdAt)}`);
      restore.current = scroller.current?.scrollHeight ?? null;
      setMessages((list) => mergeMessages(list, data.messages));
      setHasMore(data.hasMore);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  // ── Attachments ─────────────────────────────────────────
  const patchFile = (key, patch) => setFiles((list) => list.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  function addFiles(list) {
    if (!canSend) return;
    const incoming = Array.from(list ?? []);
    if (!incoming.length) return;
    const room = MAX_FILES - files.length;
    if (incoming.length > room) toast.error(`يمكن إرفاق ${MAX_FILES} ملفات كحد أقصى في الرسالة`);
    incoming.slice(0, Math.max(0, room)).forEach(async (raw) => {
      const key = uid();
      const isImage = raw.type.startsWith("image/");
      setFiles((l) => [
        ...l,
        { key, name: raw.name, size: raw.size, mime: raw.type, preview: isImage ? URL.createObjectURL(raw) : null, progress: 0, status: "uploading" },
      ]);
      const file = await compressImage(raw);
      if (file.size > maxBytes) {
        patchFile(key, { status: "error", error: `أكبر من ${Math.round(maxBytes / 1024 / 1024)}MB` });
        return;
      }
      const { promise, abort } = uploadWithProgress(file, (p) => patchFile(key, { progress: p }));
      aborts.current[key] = abort;
      try {
        const upload = await promise;
        patchFile(key, { status: "done", progress: 1, upload, size: upload.size });
      } catch (err) {
        if (!err.aborted) {
          patchFile(key, { status: "error", error: err.message });
          toast.error(err.message);
        }
      } finally {
        delete aborts.current[key];
      }
    });
    input.current?.focus();
  }

  function removeFile(f) {
    aborts.current[f.key]?.();
    if (f.preview) URL.revokeObjectURL(f.preview);
    setFiles((list) => list.filter((x) => x.key !== f.key));
  }

  useEffect(() => {
    const pending = aborts.current;
    return () => Object.values(pending).forEach((abort) => abort());
  }, []);

  // ── Sending ─────────────────────────────────────────────
  async function deliver(item) {
    setOutbox((o) => o.map((x) => (x.id === item.id ? { ...x, status: "sending" } : x)));
    try {
      const { message } = await api("/api/chat", {
        method: "POST",
        body: { ...(isStudent ? {} : { studentId }), content: item.content ?? "", attachmentIds: item.attachments.map((a) => a.id) },
      });
      atBottom.current = true;
      known.current.add(message.id);
      setOutbox((o) => o.filter((x) => x.id !== item.id));
      setMessages((list) => mergeMessages(list, [message]));
      if (!lastAt.current || message.createdAt > lastAt.current) lastAt.current = message.createdAt;
      onActivity?.();
    } catch (err) {
      setOutbox((o) => o.map((x) => (x.id === item.id ? { ...x, status: "failed" } : x)));
      toast.error(err.message);
      if (err.status === 403) setEnabled(false);
    }
  }

  function send(e) {
    e?.preventDefault();
    if (!canSend) return;
    if (files.some((f) => f.status === "uploading")) {
      toast("لحظة… ننتظر اكتمال رفع الملفات");
      return;
    }
    const content = text.trim();
    const ready = files.filter((f) => f.status === "done");
    if (!content && !ready.length) return;
    const item = {
      id: `tmp-${uid()}`,
      content: content || null,
      attachments: ready.map((f) => f.upload),
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
    setText("");
    atBottom.current = true;
    setOutbox((o) => [...o, item]);
    deliver(item);
  }

  async function removeMessage(m) {
    if (!confirm("حذف هذه الرسالة نهائيًا؟")) return;
    try {
      await api(`/api/chat/${m.id}`, { method: "DELETE" });
      setMessages((list) => list.filter((x) => x.id !== m.id));
      setSelected(null);
    } catch (err) {
      toast.error(err.message);
    }
  }

  // ── Drag & drop / paste ─────────────────────────────────
  function onDragOver(e) {
    if (!canSend || !e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  }
  function onDrop(e) {
    if (!canSend) return;
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }
  function onPaste(e) {
    const pasted = Array.from(e.clipboardData?.files ?? []);
    if (pasted.length) {
      e.preventDefault();
      addFiles(pasted);
    }
  }

  // ── Render ──────────────────────────────────────────────
  const all = [...messages, ...outbox.map((o) => ({ ...o, outgoing: true }))];
  const uploading = files.some((f) => f.status === "uploading");
  const canSubmit = canSend && !uploading && (text.trim() || files.some((f) => f.status === "done"));
  const canDelete = (m) => !m.outgoing && (viewerRole === "ADMIN" || isMine(m));

  return (
    <div
      className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {header?.({ enabled, setEnabled })}

      <div ref={scroller} onScroll={onScroll} className="scrollbar-thin relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
        {hasMore && (
          <div className="mb-3 flex justify-center">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-medium text-muted transition hover:text-fg"
            >
              {loadingOlder ? <LoaderCircle className="size-3.5 animate-spin" /> : <ChevronUp className="size-3.5" />}
              رسائل أقدم
            </button>
          </div>
        )}

        {all.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 grid size-16 place-items-center rounded-3xl bg-primary-soft text-3xl">💬</div>
            <div className="font-semibold">لا رسائل بعد</div>
            <p className="mt-1 max-w-xs text-sm text-muted">{emptyHint}</p>
          </div>
        )}

        <div className="space-y-1">
          {all.map((m, i) => {
            const mine = m.outgoing || isMine(m);
            const prev = all[i - 1];
            const newDay = mounted && (!prev || !sameDay(new Date(prev.createdAt), new Date(m.createdAt)));
            const grouped = prev && !newDay && (prev.outgoing || isMine(prev)) === mine && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60 * 1000;
            const read = mine && !m.outgoing && seenAt && m.createdAt <= seenAt;
            const onlyMedia = !m.content && m.attachments?.length > 0 && m.attachments.every((a) => INLINE_IMAGE.test(a.mime ?? ""));
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <div className="sticky top-0 z-10 flex justify-center py-2">
                    <span className="rounded-full border border-line bg-surface/90 px-3 py-1 text-[11px] font-medium text-muted backdrop-blur">{dayLabel(m.createdAt)}</span>
                  </div>
                )}
                <motion.div
                  initial={m.outgoing ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("group flex min-w-0 items-end gap-2", mine ? "justify-start" : "flex-row-reverse justify-start", !grouped && "pt-2")}
                >
                  {!mine && <div className="w-8 shrink-0 self-end">{!grouped && peerAvatar}</div>}
                  <div className={cn("flex min-w-0 max-w-[85%] items-center gap-1 sm:max-w-[70%]", !mine && "flex-row-reverse")}>
                    <div
                      onClick={() => canDelete(m) && setSelected((s) => (s === m.id ? null : m.id))}
                      className={cn(
                        "relative min-w-0 rounded-3xl text-[15px] leading-7",
                        onlyMedia ? "p-1" : "px-3.5 py-2",
                        mine ? "bg-primary text-white" : "bg-surface-2 text-fg",
                        mine ? (grouped ? "rounded-ee-lg" : "rounded-ee-md") : grouped ? "rounded-es-lg" : "rounded-es-md",
                        m.status === "failed" && "bg-coral/90",
                        selected === m.id && "ring-2 ring-primary/40 ring-offset-2 ring-offset-surface"
                      )}
                    >
                      {!mine && viewerRole === "ADMIN" && m.author?.role === "ADMIN" && !grouped && (
                        <div className="mb-0.5 text-[11px] font-semibold text-primary">{m.author.name}</div>
                      )}
                      {m.attachments?.length > 0 && (
                        <div className={cn(m.content && "mb-1.5", !onlyMedia && "-mx-1.5 mt-0.5")}>
                          <Attachments items={m.attachments} mine={mine} onImageLoad={onImageLoad} onOpenImage={setViewer} />
                        </div>
                      )}
                      {m.content && (
                        <div className="whitespace-pre-wrap break-words" dir="auto">
                          <Linkified text={m.content} />
                        </div>
                      )}
                      <div
                        className={cn(
                          "mt-0.5 flex items-center justify-end gap-1 text-[10.5px] leading-4",
                          mine ? "text-white/70" : "text-muted",
                          onlyMedia && "absolute bottom-2 end-3 rounded-full bg-black/45 px-1.5 py-0.5 text-white"
                        )}
                      >
                        {mounted ? timeFmt.format(new Date(m.createdAt)) : " "}
                        {mine &&
                          (m.status === "sending" ? (
                            <Clock className="size-3" />
                          ) : m.status === "failed" ? null : read ? (
                            <CheckCheck className="size-3.5 text-amber" aria-label="مقروءة" />
                          ) : (
                            <Check className="size-3.5" aria-label="أُرسلت" />
                          ))}
                      </div>
                    </div>
                    {m.status === "failed" && (
                      <button onClick={() => deliver(m)} className="grid size-8 shrink-0 place-items-center rounded-full text-coral hover:bg-coral-soft" aria-label="إعادة الإرسال">
                        <RotateCw className="size-4" />
                      </button>
                    )}
                    {canDelete(m) && (
                      <button
                        onClick={() => removeMessage(m)}
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-coral-soft hover:text-coral",
                          selected === m.id ? "opacity-100" : "opacity-0 focus:opacity-100 group-hover:opacity-100 max-lg:hidden"
                        )}
                        aria-label="حذف الرسالة"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </Fragment>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {newBelow > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => scrollToBottom(true)}
            className="absolute inset-x-0 bottom-24 z-10 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-pop"
          >
            <ArrowDown className="size-3.5" /> {newBelow} رسائل جديدة
          </motion.button>
        )}
      </AnimatePresence>

      {canSend ? (
        <form onSubmit={send} className="border-t border-line bg-surface p-2.5 sm:p-3">
          {!enabled && !isStudent && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-amber-soft px-3 py-2 text-xs text-[#8a5300] dark:text-amber">
              <Lock className="size-3.5 shrink-0" /> الدردشة مغلقة لهذا الطالب: يرى رسائلك لكنه لا يستطيع الرد.
            </div>
          )}
          {files.length > 0 && (
            <div className="scrollbar-thin mb-2 flex gap-2 overflow-x-auto pb-1">
              {files.map((f) => {
                const Icon = fileIcon(f);
                return (
                  <div
                    key={f.key}
                    className={cn(
                      "relative flex h-16 shrink-0 items-center gap-2 overflow-hidden rounded-2xl border bg-bg",
                      f.preview ? "w-16" : "w-48 px-2.5",
                      f.status === "error" ? "border-coral" : "border-line"
                    )}
                    title={f.error ?? f.name}
                  >
                    {f.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.preview} alt={f.name} className="size-full object-cover" />
                    ) : (
                      <>
                        <Icon className="size-6 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium" dir="auto">
                            {f.name}
                          </span>
                          <span className={cn("block text-[11px]", f.status === "error" ? "text-coral" : "text-muted")}>
                            {f.status === "error" ? f.error : formatBytes(f.size)}
                          </span>
                        </span>
                      </>
                    )}
                    {f.status === "uploading" && (
                      <div className="absolute inset-0 grid place-items-center bg-surface/60">
                        <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" strokeWidth="3.5" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={`${Math.max(4, f.progress * 94.2)} 94.2`}
                            className="transition-[stroke-dasharray] duration-200"
                          />
                        </svg>
                      </div>
                    )}
                    {f.preview && f.status === "error" && <div className="absolute inset-0 bg-coral/40" />}
                    <button
                      type="button"
                      onClick={() => removeFile(f)}
                      className="absolute end-1 top-1 grid size-5 place-items-center rounded-full bg-[#0c0a18]/70 text-white"
                      aria-label="إزالة المرفق"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-end gap-1.5 rounded-2xl border border-line bg-bg p-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
            <input
              ref={fileInput}
              type="file"
              hidden
              multiple
              accept={isStudent ? STUDENT_ACCEPT : undefined}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={imageInput}
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => imageInput.current?.click()}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-primary"
              aria-label="إرسال صورة"
              title="صورة"
            >
              <ImagePlus className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-primary"
              aria-label="إرفاق ملف"
              title="ملف"
            >
              <Paperclip className="size-5" />
            </button>
            <textarea
              ref={input}
              rows={1}
              value={text}
              dir="auto"
              maxLength={4000}
              onChange={(e) => setText(e.target.value)}
              onPaste={onPaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={isStudent ? "اكتب رسالتك للمعلّم…" : "اكتب ردّك…"}
              className="max-h-40 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-muted/70 [field-sizing:content]"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white transition hover:bg-primary-600 disabled:opacity-40"
              aria-label="إرسال"
            >
              {uploading ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5 -scale-x-100" />}
            </button>
          </div>
          <p className="mt-1.5 hidden px-1 text-[11px] text-muted sm:block">
            Enter للإرسال · Shift+Enter لسطر جديد · اسحب الملفات أو الصقها هنا (حتى {Math.round(maxBytes / 1024 / 1024)}MB للملف)
          </p>
        </form>
      ) : (
        <div className="flex items-center gap-3 border-t border-line bg-surface-2/60 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-soft text-[#b86e00] dark:text-amber">
            <Lock className="size-5" />
          </span>
          <div className="text-sm">
            <div className="font-semibold">الدردشة مغلقة حاليًا</div>
            <div className="text-muted">أغلق المعلّم المراسلة مؤقتًا. ستصلك رسالة عندما يفتحها من جديد.</div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-3xl border-2 border-dashed border-primary bg-primary-soft/80 backdrop-blur-sm"
          >
            <div className="text-center text-primary">
              <CloudUpload className="mx-auto size-10" />
              <div className="mt-2 font-semibold">أفلت الملفات لإرفاقها</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageViewer image={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
