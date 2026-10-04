// Copies the Pyodide runtime (CPython in WebAssembly) from node_modules into public/pyodide/<version>/
// so the code runner is served from our own domain instead of a third-party CDN.
// Runs on `npm install` (postinstall); the copied files are git-ignored.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const src = path.join("node_modules", "pyodide");
if (!existsSync(src)) {
  console.warn("[pyodide] package not installed, skipping copy");
  process.exit(0);
}
const { version } = JSON.parse(readFileSync(path.join(src, "package.json"), "utf8"));
const dest = path.join("public", "pyodide", `v${version}`);
const files = ["pyodide.js", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];

rmSync(path.join("public", "pyodide"), { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const f of files) cpSync(path.join(src, f), path.join(dest, f));
console.log(`[pyodide] copied v${version} to ${dest}`);
