// Browser-side helpers for talking to /api routes.

export async function api(url, { method = "GET", body, form } = {}) {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "حدث خطأ، حاول مرة أخرى");
    err.field = data.field;
    err.status = res.status;
    throw err;
  }
  return data;
}

export function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  return api("/api/uploads", { method: "POST", form });
}

/**
 * Same as uploadFile, but reports progress (0..1) and can be aborted:
 *   const { promise, abort } = uploadWithProgress(file, (p) => ...)
 */
export function uploadWithProgress(file, onProgress) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || "تعذّر رفع الملف"));
    };
    xhr.onerror = () => reject(new Error("انقطع الاتصال أثناء الرفع"));
    xhr.onabort = () => reject(Object.assign(new Error("أُلغي الرفع"), { aborted: true }));
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}

/**
 * Shrinks big photos in the browser before upload (phone pictures are often 4-12MB).
 * Returns the original file for anything that isn't a large JPEG/PNG/WebP or when it wouldn't help.
 */
export async function compressImage(file, { maxSide = 2048, quality = 0.85, minBytes = 1.5 * 1024 * 1024 } = {}) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < minBytes) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    // PNG screenshots may have transparency: keep it with WebP; photos go to JPEG.
    const type = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const blob = await new Promise((r) => canvas.toBlob(r, type, quality));
    if (!blob || blob.size >= file.size) return file;
    const ext = type === "image/jpeg" ? "jpg" : "webp";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + `.${ext}`, { type, lastModified: Date.now() });
  } catch {
    return file;
  }
}

// <input type="datetime-local"> works in the browser's local time; the API expects ISO.
export function toISO(localValue) {
  return localValue ? new Date(localValue).toISOString() : null;
}

export function toLocalInput(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
