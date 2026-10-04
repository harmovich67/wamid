"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { normalizeLanguage } from "@/lib/runner";
import { RunPanel } from "./RunPanel";

const LANGS = [
  ["python", "Python"],
  ["javascript", "JavaScript"],
  ["html", "HTML"],
];

const STARTERS = {
  python: 'name = input("ما اسمك؟ ")\nprint("أهلًا يا", name, "👋")\n\nfor i in range(1, 6):\n    print(i, "×", i, "=", i * i)\n',
  javascript: 'const name = prompt("ما اسمك؟");\nconsole.log(`أهلًا يا ${name} 👋`);\n\nfor (let i = 1; i <= 5; i++) {\n  console.log(i, "×", i, "=", i * i);\n}\n',
  html: '<!doctype html>\n<html lang="ar" dir="rtl">\n<body style="font-family: sans-serif; text-align: center">\n  <h1>صفحتي الأولى ✨</h1>\n  <button onclick="alert(\'أهلًا!\')">اضغطني</button>\n</body>\n</html>\n',
};

function load(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Editor + run panel. In a lesson it starts from the lesson's code (with "reset");
 * on the playground page (`storageKey`) the language is selectable and the code is kept per device.
 */
export function CodePlayground({ code: initialCode, language: initialLanguage = "python", title, storageKey, minLines = 8 }) {
  const [language, setLanguage] = useState(normalizeLanguage(initialLanguage));
  const [code, setCode] = useState(initialCode ?? STARTERS[normalizeLanguage(initialLanguage)] ?? "");
  const panel = useRef(null);

  // Restore the saved draft after hydration (localStorage isn't available on the server).
  useEffect(() => {
    if (!storageKey) return;
    const lang = load(`${storageKey}:lang`, language);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(lang);
    setCode(load(`${storageKey}:${lang}`, STARTERS[lang] ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(`${storageKey}:lang`, language);
        localStorage.setItem(`${storageKey}:${language}`, code);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [storageKey, language, code]);

  function switchLanguage(next) {
    setLanguage(next);
    setCode(storageKey ? load(`${storageKey}:${next}`, STARTERS[next]) : STARTERS[next]);
  }

  const original = initialCode ?? STARTERS[language];

  return (
    <div
      className="space-y-2"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          panel.current?.run();
        }
      }}
    >
      <CodeEditor
        value={code}
        onChange={setCode}
        language={language}
        filename={title}
        minLines={minLines}
        header={
          <>
            {storageKey && (
              <select
                value={language}
                onChange={(e) => switchLanguage(e.target.value)}
                className="h-7 rounded-md border border-white/10 bg-[#1c1838] px-1.5 font-mono text-xs text-white/80 outline-none focus:border-primary"
                aria-label="لغة البرمجة"
              >
                {LANGS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            )}
            {code !== original && (
              <button
                type="button"
                onClick={() => setCode(original)}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                title={storageKey ? "ابدأ من المثال" : "رجوع لكود الدرس"}
              >
                <RotateCcw className="size-3.5" /> إعادة
              </button>
            )}
          </>
        }
      />
      <RunPanel ref={panel} language={language} code={code} />
      <p className="px-1 text-[11px] text-muted">Ctrl+Enter للتشغيل · الكود يعمل داخل متصفحك فقط</p>
    </div>
  );
}
