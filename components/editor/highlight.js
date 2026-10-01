import hljs from "highlight.js/lib/common";

const ALIASES = { html: "xml" };

export function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightCode(code, language) {
  const lang = ALIASES[language] ?? language;
  try {
    if (lang && lang !== "plaintext" && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } catch {}
  return escapeHtml(code);
}

// Guesses the language of pasted code (used to label fenced blocks).
export function detectLanguage(code) {
  const map = { xml: "html", "c++": "cpp", shell: "bash" };
  const res = hljs.highlightAuto(code, ["python", "javascript", "xml", "css", "cpp", "java", "sql", "bash", "json"]);
  return map[res.language] ?? res.language ?? "plaintext";
}

// Heuristic: does this pasted text look like source code rather than prose?
export function looksLikeCode(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return false;
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length;
  if (arabic > text.length * 0.25) return false;
  const signals = [
    /^\s{2,}\S/m, // indentation
    /[;{}]\s*$/m,
    /^\s*(def|class|for|while|if|elif|else|return|import|from|function|const|let|var|#include|public|int|print|console\.log)\b/m,
    /=>|==|!=|\+=|<\/?\w+>/,
    /\w+\([^)]*\)/,
  ];
  return signals.filter((r) => r.test(text)).length >= 2;
}
