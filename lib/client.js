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
