import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { prisma } from "@/lib/db";
import { forbidden, handler, notFound } from "@/lib/api";
import { STORAGE_ROOT } from "@/lib/uploads";

// Types that are safe to display inline. Everything else (html, svg, js…) is forced to download
// so an uploaded file can never run scripts on our origin.
const INLINE = /^(image\/(png|jpe?g|gif|webp|avif)|application\/pdf|video\/|audio\/|text\/plain)/;

export const GET = handler({}, async ({ req, user, params }) => {
  const upload = await prisma.upload.findUnique({ where: { id: params.id }, include: { owner: { select: { role: true } } } });
  if (!upload) throw notFound("الملف غير موجود");

  // Teachers see everything. Students see teacher content and their own uploads only.
  if (user.role !== "ADMIN" && upload.owner.role !== "ADMIN" && upload.ownerId !== user.id) throw forbidden();

  const abs = path.join(STORAGE_ROOT, upload.path);
  if (!abs.startsWith(STORAGE_ROOT)) throw forbidden();
  let info;
  try {
    info = await stat(abs);
  } catch {
    throw notFound("الملف غير موجود");
  }

  const inline = INLINE.test(upload.mime);
  const headers = {
    "Content-Type": inline ? upload.mime : "application/octet-stream",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(upload.name)}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
  };

  // Range support so uploaded videos can seek.
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start >= info.size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
    return new Response(Readable.toWeb(createReadStream(abs, { start, end })), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${info.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(Readable.toWeb(createReadStream(abs)), { headers: { ...headers, "Content-Length": String(info.size) } });
});
