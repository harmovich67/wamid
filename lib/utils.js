import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function parseJSON(value, fallback) {
  if (value == null || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Arabic text with Latin digits — easier to read next to code.
const LOCALE = "ar-u-nu-latn";
const dateFmt = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" });
const relFmt = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

export function formatDate(d) {
  return d ? dateFmt.format(new Date(d)) : "—";
}

export function formatDateTime(d) {
  return d ? dateTimeFmt.format(new Date(d)) : "—";
}

export function timeAgo(d) {
  if (!d) return "—";
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return relFmt.format(Math.round(diff), "second");
  if (abs < 3600) return relFmt.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return relFmt.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return relFmt.format(Math.round(diff / 86400), "day");
  return formatDate(d);
}

export function formatNumber(n) {
  return new Intl.NumberFormat(LOCALE).format(n ?? 0);
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    // Skip the Arabic definite article so "المعلّم" shows "م", not "ا".
    .map((p) => (p.length > 3 && p.startsWith("ال") ? p[2] : p[0]))
    .join("");
}

export function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

// Local calendar day, used for streaks.
export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Converts a YouTube / Vimeo link into a safe embed URL. Returns null for anything else.
export function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") || u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,})/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.match(/(\d{5,})/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function generatePassword(length = 10) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function daysAgo(days) {
  return new Date(Date.now() - days * 86400000);
}
