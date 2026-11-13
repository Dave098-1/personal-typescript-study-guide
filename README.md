# Four Weeks to TypeScript

A personal study site that teaches JavaScript from zero and then TypeScript, in **4 weeks at about 3 hours a week** (12 sessions of roughly an hour).

Every session has three modes:

- **Guide**: the full written lesson. Every code sample can be edited and run.
- **Slides**: the same lesson one step at a time, with quick-check questions and the exercises at the end. Arrow keys move between slides.
- **Practice**: exercises with automatic checks, hints and solutions.

There's also a **Playground** for trying JavaScript or TypeScript freely. Progress and your exercise code are saved in your browser.

## The plan

| Week | Topic | Sessions |
| --- | --- | --- |
| 1 | JavaScript basics | Hello, JavaScript · Decisions and loops · Functions |
| 2 | Working with data | Arrays · Objects · Errors and async code |
| 3 | The TypeScript type system | Hello, TypeScript · Describing objects · Unions and narrowing |
| 4 | TypeScript in practice | Classes · Generics and utility types · Async TypeScript and the final project |

## Opening the site

It's a static site with no build step needed to use it.

- **Locally:** open `index.html` in a browser. (Or run `npm run serve` and open the address it prints.)
- **GitHub Pages:** in the repository's *Settings → Pages*, choose *Deploy from a branch*, pick the branch and the `/ (root)` folder. The site appears at `https://<user>.github.io/personal-typescript-study-guide/`.

An internet connection is needed for the code editor (CodeMirror) and the TypeScript compiler, which load from the jsDelivr CDN. Without it, the editors fall back to plain text boxes and JavaScript still runs.

## How it works

- Code runs in a Web Worker, so an infinite loop is stopped after 5 seconds instead of freezing the page.
- TypeScript is type-checked in the browser with the official compiler (strict mode), then compiled to JavaScript and run. Type errors are shown with line numbers.
- Exercise checks are small tests run after your code (`test(...)` and `expect(...)`).

## Editing the lessons

Lessons live in `content/*.md` in a simple format:

- `=== step: Title` starts a lesson step (a section in the guide and a slide in the deck).
- ` ```js ` or ` ```ts ` fences become runnable editors; add `static` (` ```js static `) for display-only code.
- `+++ guide` … `+++` is shown only in the guide; `+++ slide` … `+++` only on slides; `+++ tip` / `+++ warn` are callouts.
- `=== quiz` holds one question: `? question`, `- wrong option`, `* right option`, `> explanation`.
- `=== exercise: Title` holds instructions plus ` ```js starter `, ` ```js tests ` and ` ```js solution ` fences (use `ts` for TypeScript exercises) and `+++ hint` blocks.

After editing, rebuild the generated files:

```sh
npm install
npm run build
```

This writes `js/lessons.data.js` and `vendor/ts-libs.js` (the TypeScript standard library types used for type-checking).
