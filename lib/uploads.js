import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "./db";
import { ApiError } from "./api";

export const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

const STUDENT_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "pdf", "txt", "md", "zip",
  "py", "js", "jsx", "ts", "html", "css", "json", "cpp", "c", "h", "java", "sql", "csv",
]);
const BLOCKED_EXTENSIONS = new Set(["exe", "bat", "cmd", "msi", "sh", "ps1", "dll", "scr", "com"]);

export const LIMITS = {
  ADMIN: 100 * 1024 * 1024,
  STUDENT: 10 * 1024 * 1024,
};

function safeName(name) {
  const base = path.basename(name || "file").normalize("NFC");
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(-120) || "file";
}

export async function saveUpload(file, user) {
  if (!file || typeof file === "string") throw new ApiError(400, "لم يتم اختيار ملف");
  const limit = LIMITS[user.role] ?? LIMITS.STUDENT;
  if (file.size > limit) {
    throw new ApiError(413, `حجم الملف أكبر من المسموح (${Math.round(limit / 1024 / 1024)}MB)`);
  }
  const name = safeName(file.name);
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (BLOCKED_EXTENSIONS.has(ext)) throw new ApiError(400, "نوع الملف غير مسموح");
  if (user.role !== "ADMIN" && !STUDENT_EXTENSIONS.has(ext)) {
    throw new ApiError(400, "نوع الملف غير مسموح. المسموح: صور، PDF، ملفات كود، ZIP");
  }

  const now = new Date();
  const rel = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"), `${randomUUID()}-${name}`);
  const abs = path.join(STORAGE_ROOT, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));

  const upload = await prisma.upload.create({
    data: { ownerId: user.id, name, mime: file.type || "application/octet-stream", size: file.size, path: rel },
  });
  return { id: upload.id, url: `/api/files/${upload.id}`, name, size: file.size, mime: upload.mime };
}
