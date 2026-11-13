// Build script: turns content/*.md into js/lessons.data.js
// and packs the TypeScript standard library type files into vendor/ts-libs.js.
//
// Usage: npm run build
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { marked } from "marked";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Code fences: ```js or ```ts become runnable editors; add "static" to show code only.
marked.use({
  renderer: {
    code(code, info) {
      const [lang = "text", ...flags] = (info || "").trim().split(/\s+/);
      const runnable = (lang === "js" || lang === "ts") && !flags.includes("static");
      return `<div class="code" data-lang="${lang}" data-mode="${runnable ? "run" : "static"}"><pre><code>${escapeHtml(
        code.replace(/\n$/, "")
      )}</code></pre></div>\n`;
    },
  },
});

const md = (s) => marked.parse(s.trim());
const mdInline = (s) => marked.parseInline(s.trim());

// Split text into plain chunks and "+++ kind ... +++" chunks.
function chunks(text) {
  const out = [];
  const re = /^\+\+\+ *(\w+)\s*\n([\s\S]*?)^\+\+\+\s*$/gm;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: "main", text: text.slice(last, m.index) });
    out.push({ kind: m[1], text: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ kind: "main", text: text.slice(last) });
  return out.filter((c) => c.text.trim());
}

function parseStep(title, body) {
  const html = chunks(body)
    .map((c) => {
      if (c.kind === "main") return md(c.text);
      if (c.kind === "guide") return `<div class="only-guide">${md(c.text)}</div>`;
      if (c.kind === "slide") return `<div class="only-slide">${md(c.text)}</div>`;
      if (c.kind === "tip") return `<aside class="tip">${md(c.text)}</aside>`;
      if (c.kind === "warn") return `<aside class="tip warn">${md(c.text)}</aside>`;
      throw new Error("Unknown block +++ " + c.kind);
    })
    .join("\n");
  return { type: "step", title, html };
}

function parseQuiz(title, body, where) {
  const lines = body.trim().split("\n");
  const q = { type: "quiz", title: title || "Quick check", question: "", options: [], answer: -1, explain: "" };
  const qLines = [];
  const explain = [];
  for (const line of lines) {
    if (line.startsWith("? ")) qLines.push(line.slice(2));
    else if (line.startsWith("- ")) q.options.push(mdInline(line.slice(2)));
    else if (line.startsWith("* ")) {
      q.answer = q.options.length;
      q.options.push(mdInline(line.slice(2)));
    } else if (line.startsWith("> ")) explain.push(line.slice(2));
    else if (line.trim() && qLines.length && !q.options.length) qLines.push(line);
  }
  q.question = md(qLines.join("\n"));
  q.explain = md(explain.join("\n"));
  if (q.answer < 0 || q.options.length < 2) throw new Error("Bad quiz in " + where);
  return q;
}

function parseExercise(title, body, lessonId, n) {
  const ex = { type: "exercise", id: `${lessonId}-ex${n}`, title, lang: "js", starter: "", tests: "", solution: "", hints: [], html: "" };
  // pull out the special fences first
  let rest = body.replace(/^```(js|ts) (starter|tests|solution)\n([\s\S]*?)^```\s*$/gm, (_, lang, kind, code) => {
    ex[kind] = code.replace(/\n$/, "");
    if (kind === "starter") ex.lang = lang;
    return "";
  });
  const parts = chunks(rest);
  ex.html = parts.filter((c) => c.kind === "main").map((c) => md(c.text)).join("\n");
  ex.hints = parts.filter((c) => c.kind === "hint").map((c) => md(c.text));
  if (!ex.starter || !ex.tests || !ex.solution) throw new Error("Exercise missing starter/tests/solution: " + ex.id);
  return ex;
}

function parseLesson(file) {
  const src = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error("Missing front matter in " + file);
  const meta = {};
  for (const line of fm[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const lesson = {
    id: meta.id,
    week: Number(meta.week),
    session: Number(meta.session),
    lang: meta.lang,
    title: meta.title,
    minutes: Number(meta.minutes),
    summary: mdInline(meta.summary),
    goals: meta.goals.split("|").map((g) => mdInline(g)),
    sections: [],
  };
  const body = src.slice(fm[0].length);
  const sections = body.split(/^=== /m).slice(1);
  let exN = 0;
  for (const sec of sections) {
    const nl = sec.indexOf("\n");
    const head = sec.slice(0, nl).trim();
    const text = sec.slice(nl + 1);
    const [kind, ...t] = head.split(":");
    const title = t.join(":").trim();
    if (kind === "step") lesson.sections.push(parseStep(title, text));
    else if (kind === "quiz") lesson.sections.push(parseQuiz(title, text, file));
    else if (kind === "exercise") lesson.sections.push(parseExercise(title, text, lesson.id, ++exN));
    else throw new Error(`Unknown section "${kind}" in ${file}`);
  }
  return lesson;
}

// ---- lessons
const contentDir = path.join(root, "content");
const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md")).sort();
const lessons = files.map((f) => parseLesson(path.join(contentDir, f)));
fs.writeFileSync(
  path.join(root, "js/lessons.data.js"),
  "// Generated by scripts/build.mjs from content/*.md. Do not edit by hand.\nwindow.LESSONS = " +
    JSON.stringify(lessons) +
    ";\n"
);
const counts = lessons.map((l) => {
  const c = (t) => l.sections.filter((s) => s.type === t).length;
  return `${l.id}: ${c("step")} steps, ${c("quiz")} quizzes, ${c("exercise")} exercises`;
});
console.log(counts.join("\n"));

// ---- TypeScript lib files (comments stripped) for in-browser type checking
const libDir = path.join(path.dirname(require.resolve("typescript")));
const seen = new Set();
(function walk(name) {
  const f = `lib.${name}.d.ts`;
  if (seen.has(f)) return;
  seen.add(f);
  const t = fs.readFileSync(path.join(libDir, f), "utf8");
  for (const m of t.matchAll(/reference lib="([^"]+)"/g)) walk(m[1]);
})("es2023");
const printer = ts.createPrinter({ removeComments: true });
const libs = {};
for (const f of seen) {
  const sf = ts.createSourceFile(f, fs.readFileSync(path.join(libDir, f), "utf8"), ts.ScriptTarget.Latest);
  libs[f] = printer.printFile(sf);
}
fs.writeFileSync(
  path.join(root, "vendor/ts-libs.js"),
  `// Generated by scripts/build.mjs: TypeScript ${ts.version} standard library types.\nwindow.TS_LIBS = ${JSON.stringify(libs)};\n`
);
console.log(`Packed ${seen.size} lib files for TypeScript ${ts.version}`);

// ---- Vendor bundles: CodeMirror and the TypeScript compiler, served from this site (works offline)
const esbuild = require("esbuild");
const cm = path.join(root, "node_modules/codemirror");
const cmSrc = ["lib/codemirror.js", "mode/javascript/javascript.js", "addon/edit/matchbrackets.js", "addon/edit/closebrackets.js", "addon/runmode/runmode.js"]
  .map((f) => fs.readFileSync(path.join(cm, f), "utf8"))
  .join("\n;\n");
fs.writeFileSync(
  path.join(root, "vendor/codemirror.min.js"),
  "/* CodeMirror 5 (MIT license, codemirror.net) */\n" + esbuild.transformSync(cmSrc, { minify: true }).code
);
const tsMin = esbuild.transformSync(fs.readFileSync(require.resolve("typescript"), "utf8"), { minify: true, legalComments: "none" }).code;
fs.writeFileSync(path.join(root, "vendor/typescript.min.js"), `/* TypeScript ${ts.version} (Apache-2.0 license, typescriptlang.org) */\n` + tsMin);
console.log("Bundled CodeMirror and the TypeScript compiler");

// ---- Service worker: precache every file so the installed site works offline
import crypto from "node:crypto";
const precache = [
  "./", "index.html", "manifest.webmanifest", "css/codemirror.css", "css/style.css",
  "vendor/codemirror.min.js", "vendor/typescript.min.js", "vendor/ts-libs.js",
  "js/lessons.data.js", "js/runner.js", "js/app.js",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];
const hash = crypto.createHash("sha256");
for (const f of precache.slice(1)) hash.update(fs.readFileSync(path.join(root, f)));
const version = hash.digest("hex").slice(0, 12);
fs.writeFileSync(
  path.join(root, "sw.js"),
  `// Generated by scripts/build.mjs. Caches the whole site for offline use.
const CACHE = "fwts-${version}";
const FILES = ${JSON.stringify(precache, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fwts-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !isFont) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => (req.mode === "navigate" ? caches.match("index.html") : Response.error()));
    })
  );
});
`
);
console.log("Wrote sw.js (cache " + version + ")");

// ---- Single-file offline version: everything inlined into one HTML file
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const safe = (s) => s.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
const inlineScripts = ["vendor/codemirror.min.js", "js/lessons.data.js", "vendor/ts-libs.js", "vendor/typescript.min.js", "js/runner.js", "js/app.js"]
  .map((f) => `<script>\n${safe(fs.readFileSync(path.join(root, f), "utf8"))}\n</script>`)
  .join("\n");
let single = indexHtml
  .replace(/<link rel="manifest"[^>]*>\n/, "")
  .replace(/<link rel="apple-touch-icon"[^>]*>\n/, "")
  .replace(/<link rel="icon"[^>]*>\n/, `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(fs.readFileSync(path.join(root, "icons/icon.svg"), "utf8"))}">\n`)
  .replace(
    /<link rel="stylesheet" href="css\/codemirror.css">\n<link rel="stylesheet" href="css\/style.css">/,
    () => `<style>\n${fs.readFileSync(path.join(root, "css/codemirror.css"), "utf8")}\n${fs.readFileSync(path.join(root, "css/style.css"), "utf8")}\n</style>`
  )
  .replace(/<script src="[^"]+"><\/script>\n/g, "")
  .replace("</body>", () => `<script>window.STUDY_SINGLE_FILE = true;</script>\n${inlineScripts}\n</body>`);
fs.mkdirSync(path.join(root, "offline"), { recursive: true });
fs.writeFileSync(path.join(root, "offline/four-weeks-to-typescript.html"), single);
console.log(`Wrote offline/four-weeks-to-typescript.html (${(single.length / 1e6).toFixed(1)} MB)`);
