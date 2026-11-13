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
