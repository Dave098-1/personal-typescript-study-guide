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

It's a static site with no build step needed to use it, and everything it needs (the code editor and the TypeScript compiler) is included, so it works without internet.

- **Locally:** open `index.html` in a browser. (Or run `npm run serve` and open the address it prints.)
- **GitHub Pages:** in the repository's *Settings → Pages*, choose *Deploy from a branch*, pick the branch and the `/ (root)` folder. The site appears at `https://<user>.github.io/personal-typescript-study-guide/`. (Pages is free for public repositories.)

## Using it offline on a phone

**Option 1: install it (iPhone and Android).** Open the GitHub Pages address once while online. The footer says *"This site is saved on this device and works offline"* when everything is cached. Then:

- iPhone (Safari): Share button → **Add to Home Screen**.
- Android (Chrome): ⋮ menu → **Add to Home screen** / **Install app**.

Open it from the home-screen icon; it works in airplane mode.

**Option 2: a single file (best on Android).** `offline/four-weeks-to-typescript.html` is the whole site in one 4 MB file. Save it to the phone and open it with Chrome. On iPhone the Files app previews HTML without running JavaScript, so use option 1 there.

Progress is saved separately in each copy (the installed site, the single file, a desktop browser).

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

This writes `js/lessons.data.js`, the bundled editor and compiler in `vendor/`, the offline service worker `sw.js`, and the single-file version in `offline/`.
