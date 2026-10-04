// Runs student code in the browser, isolated from the page:
//  - Python: Pyodide (CPython compiled to WebAssembly) in a long-lived Web Worker.
//  - JavaScript: a fresh Web Worker per run (console.* and prompt() are redirected).
//  - HTML: rendered by the caller in a sandboxed <iframe> (no worker needed).
// Infinite loops are stopped by terminating the worker after TIMEOUT_MS.

// Pyodide is served from our own domain (copied from node_modules by scripts/copy-pyodide.mjs) so it
// works on school/office networks that block third-party CDNs; the public CDN is only a fallback.
const PYODIDE_VERSION = "314.0.7";
const PYODIDE_LOCAL = `/pyodide/v${PYODIDE_VERSION}/`;
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const TIMEOUT_MS = 10000;

const ALIASES = { py: "python", python3: "python", js: "javascript", mjs: "javascript", htm: "html" };
export const normalizeLanguage = (lang) => ALIASES[lang] ?? lang;
export const isRunnable = (lang) => ["python", "javascript", "html"].includes(normalizeLanguage(lang));

const pyWorkerSource = (bases) => `
const BASES = ${JSON.stringify(bases)};
let boot = null;

// Tries each source in turn; a source "works" only if the script loads AND the runtime boots.
async function start() {
  let lastError = null;
  for (const base of BASES) {
    try {
      importScripts(base + "pyodide.js");
      return await loadPyodide({ indexURL: base });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("no source");
}

self.onmessage = async (e) => {
  const { code, stdin } = e.data;
  let py;
  try {
    if (!boot) { postMessage({ type: "loading" }); boot = start(); }
    py = await boot;
  } catch (err) {
    boot = null;
    postMessage({ type: "fatal", text: "تعذّر تحميل Python. تأكد من اتصالك بالإنترنت ثم حاول مجددًا." });
    postMessage({ type: "done" });
    return;
  }
  const lines = (stdin || "").split("\\n");
  if (lines.at(-1) === "") lines.pop();
  let i = 0;
  const out = new TextDecoder(), err = new TextDecoder();
  py.setStdout({ write: (b) => (postMessage({ type: "out", text: out.decode(b, { stream: true }) }), b.length) });
  py.setStderr({ write: (b) => (postMessage({ type: "err", text: err.decode(b, { stream: true }) }), b.length) });
  py.setStdin({ stdin: () => (i < lines.length ? (postMessage({ type: "in", text: lines[i] + "\\n" }), lines[i++] + "\\n") : undefined) });
  postMessage({ type: "start" });
  const ns = py.globals.get("dict")();
  try {
    // Extra packages (numpy…) only load when reachable; plain scripts never need them.
    try { await py.loadPackagesFromImports(code); } catch {}
    await py.runPythonAsync(code, { globals: ns });
  } catch (e2) {
    postMessage({ type: "error", text: String(e2.message || e2) });
  } finally {
    try { py.runPython("import sys\\nsys.stdout.flush()\\nsys.stderr.flush()"); } catch {}
    ns.destroy();
    postMessage({ type: "done" });
  }
};`;

const JS_WORKER = `
const fmt = (v) => {
  if (typeof v === "string") return v;
  if (v instanceof Error) return v.name + ": " + v.message;
  try { const s = JSON.stringify(v, null, 2); return s === undefined ? String(v) : s; } catch { return String(v); }
};
const send = (type, args) => postMessage({ type, text: args.map(fmt).join(" ") + "\\n" });
self.onmessage = async (e) => {
  const lines = (e.data.stdin || "").split("\\n");
  let i = 0;
  self.prompt = (msg) => {
    if (msg) postMessage({ type: "out", text: String(msg) });
    const line = i < lines.length && !(i === lines.length - 1 && lines[i] === "") ? lines[i++] : null;
    if (line !== null) postMessage({ type: "in", text: line + "\\n" });
    return line;
  };
  self.alert = (m) => send("out", [m]);
  console.log = console.info = console.debug = (...a) => send("out", a);
  console.warn = console.error = (...a) => send("err", a);
  console.table = (d) => send("out", [d]);
  self.addEventListener("unhandledrejection", (ev) => send("error", [ev.reason]));
  postMessage({ type: "start" });
  try {
    await (0, eval)("(async () => {\\n" + e.data.code + "\\n})()");
  } catch (err) {
    postMessage({ type: "error", text: err && err.name ? err.name + ": " + err.message : String(err) });
  } finally {
    postMessage({ type: "done" });
  }
};`;

function workerFrom(source) {
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}

let pyWorker = null;

/**
 * Starts a run and streams events to `onEvent({ type, text })`:
 *   loading (first Python boot) → start → out | err | in … → error? → done | timeout | stopped
 * Returns { stop }.
 */
export function runCode({ language, code, stdin = "", onEvent }) {
  const lang = normalizeLanguage(language);
  if (lang !== "python" && lang !== "javascript") throw new Error(`لا يمكن تشغيل ${language}`);

  const isPy = lang === "python";
  const worker = isPy ? (pyWorker ??= workerFrom(pyWorkerSource([new URL(PYODIDE_LOCAL, location.href).href, PYODIDE_CDN]))) : workerFrom(JS_WORKER);
  let timer = null;
  let finished = false;
  let fatal = false;

  const finish = (type) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    worker.onmessage = null;
    if (type !== "done") {
      // A stuck run can't be interrupted: throw the worker away (Python reloads on the next run).
      worker.terminate();
      if (isPy) pyWorker = null;
    } else if (!isPy) {
      // Let pending timers print for a moment, then free the worker.
      setTimeout(() => worker.terminate(), 3000);
    }
    onEvent({ type });
  };

  worker.onmessage = (e) => {
    const msg = e.data;
    if (msg.type === "start") {
      // The clock starts once the code runs, so the first Python download doesn't count.
      timer = setTimeout(() => finish("timeout"), TIMEOUT_MS);
    }
    if (msg.type === "done") return finish(fatal ? "stopped" : "done");
    if (msg.type === "fatal") {
      // Python itself could not load: drop the worker so the next run retries from scratch.
      fatal = true;
      pyWorker = null;
      return onEvent({ type: "error", text: msg.text });
    }
    onEvent(msg);
  };
  worker.onerror = (e) => {
    onEvent({ type: "error", text: e.message || "تعذّر تشغيل الكود" });
    finish("stopped");
  };
  worker.postMessage({ code, stdin });
  return { stop: () => finish("stopped") };
}

// ── Friendly Python errors for kids ──────────────────────────

const HINTS = {
  NameError: "استخدمت اسمًا غير معرّف. تأكد من كتابة اسم المتغير أو الدالة بنفس الحروف، ومن تعريفه قبل استخدامه.",
  SyntaxError: "في كتابة الكود خطأ. راجع الأقواس والنقطتين : في نهاية if و for و def وعلامات التنصيص.",
  IndentationError: "المسافات في بداية السطر غير صحيحة. Python تعتمد على الإزاحة (4 مسافات) داخل if و for و def.",
  TabError: "خلطت بين Tab والمسافات في الإزاحة. استخدم المسافات فقط.",
  TypeError: "تستخدم نوع بيانات بطريقة لا تناسبه، مثل جمع نص مع رقم. جرّب int() أو str() للتحويل.",
  ValueError: "القيمة غير مناسبة، مثل تحويل نص ليس رقمًا باستخدام int().",
  ZeroDivisionError: "لا يمكن القسمة على صفر!",
  IndexError: "تحاول الوصول لعنصر غير موجود في القائمة. تذكّر أن العدّ يبدأ من 0.",
  KeyError: "المفتاح غير موجود في القاموس (dict).",
  AttributeError: "هذا النوع لا يملك الخاصية أو الدالة التي استدعيتها. راجع الاسم.",
  EOFError: "البرنامج يطلب إدخالًا (input) لكن خانة «المدخلات» فارغة. اكتب فيها القيم، كل قيمة في سطر، ثم شغّل مرة أخرى.",
  ModuleNotFoundError: "هذه المكتبة غير متاحة في المتصفح.",
  RecursionError: "الدالة تستدعي نفسها بلا نهاية.",
  ReferenceError: "استخدمت اسمًا غير معرّف. تأكد من تعريف المتغير بـ let أو const قبل استخدامه.",
};

/** Turns a raw error into { type, message, line, hint, trace } with Pyodide internals removed. */
export function explainError(raw, language) {
  const text = String(raw ?? "").trim();
  let trace = text;
  if (normalizeLanguage(language) === "python") {
    const lines = text.split("\n");
    const start = lines.findIndex((l) => l.includes('File "<exec>"'));
    trace = start >= 0 ? lines.slice(start).join("\n") : text;
  }
  const last = trace.split("\n").filter(Boolean).at(-1) ?? "";
  const match = last.match(/^(\w+(?:Error|Exception)?):\s*(.*)$/);
  const type = match?.[1] ?? null;
  const lineNo = [...trace.matchAll(/line (\d+)/g)].at(-1)?.[1];
  return {
    type,
    message: match?.[2] ?? last,
    line: lineNo ? Number(lineNo) : null,
    hint: (type && HINTS[type]) ?? null,
    trace,
  };
}
