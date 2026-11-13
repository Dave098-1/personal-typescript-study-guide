// Study guide app: routing, views (home, lesson guide/slides/practice, playground),
// editors, quizzes and progress tracking.
(function () {
  "use strict";

  const LESSONS = window.LESSONS || [];
  const WEEKS = [
    { n: 1, lang: "js", title: "JavaScript basics", blurb: "Values, decisions, loops and functions. The grammar every program is built from." },
    { n: 2, lang: "js", title: "Working with data", blurb: "Arrays, objects and asynchronous code: how real programs hold and fetch information." },
    { n: 3, lang: "ts", title: "The TypeScript type system", blurb: "Add types to the JavaScript you know, and let the compiler catch mistakes before you run anything." },
    { n: 4, lang: "ts", title: "TypeScript in practice", blurb: "Classes, generics and utility types, then a final project that uses everything." },
  ];
  const app = document.getElementById("app");

  // ---------------------------------------------------------------- state
  const KEY = "ts-study-guide-v1";
  let state = { done: {}, passed: {}, code: {}, slide: {}, mode: "guide", play: null };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) state = Object.assign(state, saved);
  } catch (e) { /* storage unavailable */ }
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }, 150);
  }

  // ---------------------------------------------------------------- helpers
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const exercisesOf = (l) => l.sections.filter((s) => s.type === "exercise");
  const lessonIndex = (id) => LESSONS.findIndex((l) => l.id === id);
  const langName = (l) => (l === "ts" ? "TypeScript" : "JavaScript");
  const totalExercises = () => LESSONS.reduce((n, l) => n + exercisesOf(l).length, 0);
  const passedCount = (l) => exercisesOf(l).filter((e) => state.passed[e.id]).length;

  function nextLesson() {
    return LESSONS.find((l) => !state.done[l.id]) || null;
  }

  // ---------------------------------------------------------------- editors
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
  const runKey = isMac ? "⌘ Enter" : "Ctrl Enter";

  function makeEditor(host, value, lang, onRun, onChange) {
    if (window.CodeMirror) {
      const cm = window.CodeMirror(host, {
        value,
        mode: lang === "ts" ? "text/typescript" : "text/javascript",
        theme: "study",
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        smartIndent: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        viewportMargin: Infinity,
        extraKeys: {
          "Ctrl-Enter": () => onRun(),
          "Cmd-Enter": () => onRun(),
          Tab: (c) => (c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("  ", "end")),
          "Shift-Tab": (c) => c.indentSelection("subtract"),
          Esc: (c) => c.getInputField().blur(),
        },
      });
      if (onChange) cm.on("change", () => onChange(cm.getValue()));
      return { get: () => cm.getValue(), set: (v) => cm.setValue(v), refresh: () => cm.refresh() };
    }
    const ta = document.createElement("textarea");
    ta.className = "plain-editor";
    ta.spellcheck = false;
    ta.value = value;
    const fit = () => { ta.rows = Math.max(3, ta.value.split("\n").length + 1); };
    fit();
    ta.addEventListener("input", () => { fit(); if (onChange) onChange(ta.value); });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onRun(); }
      else if (e.key === "Tab") {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText("  ", s, ta.selectionEnd, "end");
      }
    });
    host.appendChild(ta);
    return { get: () => ta.value, set: (v) => { ta.value = v; fit(); }, refresh() {} };
  }

  function highlightStatic(block) {
    const code = block.querySelector("code");
    const lang = block.dataset.lang;
    if (!window.CodeMirror || !window.CodeMirror.runMode || !(lang === "js" || lang === "ts")) return;
    const text = code.textContent;
    code.textContent = "";
    window.CodeMirror.runMode(text, lang === "ts" ? "text/typescript" : "text/javascript", code);
    code.classList.add("cm-s-study");
  }

  // ---------------------------------------------------------------- output
  function makeOutput(box) {
    const api = {
      clear() { box.innerHTML = ""; box.hidden = false; },
      line(kind, text, label) {
        const row = el(`<div class="out-line out-${kind}"></div>`);
        if (label) row.appendChild(el(`<span class="out-label">${esc(label)}</span>`));
        row.appendChild(document.createTextNode(text));
        box.appendChild(row);
        return row;
      },
      status(text) {
        let s = box.querySelector(".out-status");
        if (!text) { if (s) s.remove(); return; }
        if (!s) { s = el('<div class="out-status"></div>'); box.prepend(s); }
        s.textContent = text;
      },
      handle(lang) {
        return (ev) => {
          if (ev.type === "status") api.status(ev.text);
          else if (ev.type === "type-error") api.line("type", ev.text, `Type error · line ${ev.line}`);
          else if (ev.type === "error") api.line("error", lang === "ts" ? ev.text.replace(/\s+\(line \d+\)$/, "") : ev.text, "Error");
          else if (ev.type === "log") api.line(ev.kind, ev.text);
        };
      },
    };
    return api;
  }

  async function execute({ code, lang, tests, out }) {
    out.clear();
    const res = await window.Runner.run({ code, lang, tests, onEvent: out.handle(lang) });
    out.status("");
    if (!out.box().querySelector(".out-line")) out.line("muted", "(No output. Use console.log(...) to print something.)");
    if (lang === "ts" && res.typeErrors && res.typeErrors.length && !res.loadFailed) {
      out.line("note", `TypeScript found ${res.typeErrors.length} type error${res.typeErrors.length > 1 ? "s" : ""}. The JavaScript still ran, but fix the errors above.`);
    }
    return res;
  }

  // ---------------------------------------------------------------- code widgets
  const refreshers = new Set();

  function mountRunner(block) {
    const lang = block.dataset.lang;
    const original = block.querySelector("code").textContent;
    const w = el(`<div class="runner">
      <div class="runner-bar">
        <span class="lang-badge lang-${lang}">${langName(lang)}</span>
        <span class="runner-hint">${runKey} to run</span>
        <button type="button" class="btn ghost small" data-act="reset">Reset</button>
        <button type="button" class="btn run small" data-act="run"><span aria-hidden="true">▶</span> Run</button>
      </div>
      <div class="runner-editor"></div>
      <div class="runner-out" hidden aria-live="polite"></div>
    </div>`);
    block.replaceWith(w);
    const outBox = w.querySelector(".runner-out");
    const out = makeOutput(outBox);
    out.box = () => outBox;
    const run = () => execute({ code: ed.get(), lang, out });
    const ed = makeEditor(w.querySelector(".runner-editor"), original, lang, run);
    refreshers.add(ed);
    w.querySelector('[data-act="run"]').onclick = run;
    w.querySelector('[data-act="reset"]').onclick = () => { ed.set(original); outBox.hidden = true; };
  }

  function exerciseWidget(ex, lesson) {
    const w = el(`<div class="exercise" id="${ex.id}">
      <div class="ex-head">
        <span class="ex-kicker">Exercise</span>
        <h3>${esc(ex.title)}</h3>
        <span class="ex-status" data-status></span>
      </div>
      <div class="ex-body prose">${ex.html}</div>
      <div class="runner">
        <div class="runner-bar">
          <span class="lang-badge lang-${ex.lang}">${langName(ex.lang)}</span>
          <span class="runner-hint">${runKey} to run</span>
          <button type="button" class="btn ghost small" data-act="reset">Reset</button>
          <button type="button" class="btn small" data-act="run"><span aria-hidden="true">▶</span> Run</button>
          <button type="button" class="btn run small" data-act="check">Check answer</button>
        </div>
        <div class="runner-editor"></div>
        <div class="runner-out" hidden aria-live="polite"></div>
      </div>
      <div class="ex-tools">
        ${ex.hints.length ? `<button type="button" class="btn ghost small" data-act="hint">Show a hint</button>` : ""}
        <button type="button" class="btn ghost small" data-act="solution">Show solution</button>
      </div>
      <div class="ex-hints"></div>
      <div class="ex-solution" hidden></div>
    </div>`);
    const outBox = w.querySelector(".runner-out");
    const out = makeOutput(outBox);
    out.box = () => outBox;
    const statusEl = w.querySelector("[data-status]");
    const paintStatus = () => {
      statusEl.textContent = state.passed[ex.id] ? "Passed" : "Not passed yet";
      statusEl.className = "ex-status " + (state.passed[ex.id] ? "is-pass" : "");
    };
    paintStatus();

    const run = () => execute({ code: ed.get(), lang: ex.lang, out });
    const check = async () => {
      const res = await execute({ code: ed.get(), lang: ex.lang, tests: ex.tests, out });
      if (res.loadFailed) return;
      const list = el('<div class="test-results"></div>');
      const results = res.results.slice();
      if (ex.lang === "ts") {
        const n = res.typeErrors.length;
        results.unshift({ name: "No type errors", pass: n === 0, message: n ? `${n} type error${n > 1 ? "s" : ""} to fix (see above)` : "" });
      }
      if (!res.results.length) results.push({ name: "Your code runs to the end", pass: false, message: res.timedOut ? "it timed out" : "it stopped with an error before the tests could run" });
      for (const r of results) {
        list.appendChild(el(`<div class="test ${r.pass ? "pass" : "fail"}"><span class="test-icon" aria-hidden="true">${r.pass ? "✓" : "✗"}</span><span><strong>${esc(r.name)}</strong>${r.pass ? "" : `<br><span class="test-msg">${esc(r.message || "")}</span>`}</span></div>`));
      }
      const allPass = results.every((r) => r.pass);
      list.prepend(el(`<div class="test-summary ${allPass ? "pass" : "fail"}">${allPass ? "All checks passed. Nice work!" : `${results.filter((r) => !r.pass).length} of ${results.length} checks failed. Read the messages, change your code and check again.`}</div>`));
      outBox.appendChild(list);
      if (allPass) {
        state.passed[ex.id] = true;
        save();
        paintStatus();
        document.dispatchEvent(new CustomEvent("progress"));
      }
    };

    const ed = makeEditor(w.querySelector(".runner-editor"), state.code[ex.id] ?? ex.starter, ex.lang, run, (v) => {
      state.code[ex.id] = v;
      save();
    });
    refreshers.add(ed);
    w.querySelector('[data-act="run"]').onclick = run;
    w.querySelector('[data-act="check"]').onclick = check;
    w.querySelector('[data-act="reset"]').onclick = () => {
      ed.set(ex.starter);
      delete state.code[ex.id];
      save();
      outBox.hidden = true;
    };
    let hintN = 0;
    const hintBtn = w.querySelector('[data-act="hint"]');
    if (hintBtn) hintBtn.onclick = () => {
      const hintsBox = w.querySelector(".ex-hints");
      hintsBox.appendChild(el(`<div class="hint prose"><span class="hint-label">Hint ${hintN + 1} of ${ex.hints.length}</span>${ex.hints[hintN]}</div>`));
      hintN++;
      if (hintN >= ex.hints.length) hintBtn.hidden = true;
      else hintBtn.textContent = "Show another hint";
    };
    const solBtn = w.querySelector('[data-act="solution"]');
    const solBox = w.querySelector(".ex-solution");
    solBtn.onclick = () => {
      if (!solBox.hidden) { solBox.hidden = true; solBtn.textContent = "Show solution"; return; }
      if (!solBox.firstChild) {
        solBox.appendChild(el(`<p class="sol-note">One possible solution. Yours can look different and still be right. Try to understand each line before you copy anything.</p>`));
        const blk = el(`<div class="code" data-lang="${ex.lang}" data-mode="static"><pre><code></code></pre></div>`);
        blk.querySelector("code").textContent = ex.solution;
        solBox.appendChild(blk);
        highlightStatic(blk);
        const use = el(`<button type="button" class="btn ghost small">Put solution in the editor</button>`);
        use.onclick = () => { ed.set(ex.solution); };
        solBox.appendChild(use);
      }
      solBox.hidden = false;
      solBtn.textContent = "Hide solution";
    };
    return w;
  }

  function quizWidget(q, idx) {
    const w = el(`<div class="quiz">
      <div class="quiz-kicker">${esc(q.title)}</div>
      <div class="quiz-q prose">${q.question}</div>
      <div class="quiz-options" role="group"></div>
      <div class="quiz-explain prose" hidden></div>
    </div>`);
    const opts = w.querySelector(".quiz-options");
    const explain = w.querySelector(".quiz-explain");
    q.options.forEach((o, i) => {
      const b = el(`<button type="button" class="quiz-opt"><span class="quiz-letter">${"ABCDEF"[i]}</span><span>${o}</span></button>`);
      b.onclick = () => {
        const right = i === q.answer;
        b.classList.add(right ? "right" : "wrong");
        if (right) {
          opts.querySelectorAll("button").forEach((x) => (x.disabled = true));
          explain.innerHTML = `<p class="quiz-verdict right">Correct.</p>` + q.explain;
        } else {
          b.disabled = true;
          explain.innerHTML = `<p class="quiz-verdict wrong">Not quite. Try another answer.</p>`;
        }
        explain.hidden = false;
      };
      opts.appendChild(b);
    });
    return w;
  }

  function enhance(root) {
    root.querySelectorAll('.code[data-mode="run"]').forEach(mountRunner);
    root.querySelectorAll('.code[data-mode="static"]').forEach(highlightStatic);
  }

  // ---------------------------------------------------------------- shared bits
  function progressBar(value, max, label) {
    const pct = max ? Math.round((value / max) * 100) : 0;
    return `<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}" aria-label="${esc(label)}"><span style="width:${pct}%"></span></div>`;
  }

  function setTitle(t) {
    document.title = t ? `${t} · Four Weeks to TypeScript` : "Four Weeks to TypeScript";
  }

  // ---------------------------------------------------------------- views
  function viewHome() {
    setTitle("");
    const done = LESSONS.filter((l) => state.done[l.id]).length;
    const exTotal = totalExercises();
    const exDone = Object.keys(state.passed).filter((k) => state.passed[k]).length;
    const next = nextLesson();
    const v = el(`<div class="home">
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">A 4-week plan · about 3 hours a week</p>
          <h1>Four Weeks to <span class="ts-word">TypeScript</span></h1>
          <p class="lede">Start with zero JavaScript. Finish writing typed, tested TypeScript. Each week has three sessions of about an hour. Weeks 1 and 2 teach JavaScript, because TypeScript <em>is</em> JavaScript with types added. Weeks 3 and 4 add the types.</p>
          <div class="hero-actions">
            ${next ? `<a class="btn run big" href="#${next.id}">${done ? "Continue" : "Start"}: Week ${next.week}, session ${next.session}</a>` : `<a class="btn run big" href="#playground">All done. Open the playground</a>`}
            <a class="btn ghost big" href="#playground">Open the playground</a>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat"><span class="stat-num">${done}<small>/${LESSONS.length}</small></span><span class="stat-label">sessions complete</span>${progressBar(done, LESSONS.length, "Sessions complete")}</div>
          <div class="stat"><span class="stat-num">${exDone}<small>/${exTotal}</small></span><span class="stat-label">exercises passed</span>${progressBar(exDone, exTotal, "Exercises passed")}</div>
        </div>
      </section>

      <section class="how">
        <h2>Three ways into every session</h2>
        <div class="how-grid">
          <div class="how-item"><span class="how-tag">Guide</span><p>The full written lesson. Read it top to bottom; every code sample has a Run button so you can try it and change it.</p></div>
          <div class="how-item"><span class="how-tag">Slides</span><p>The same lesson in small steps, one idea per slide, with quick questions and the exercises at the end. Use the arrow keys to move.</p></div>
          <div class="how-item"><span class="how-tag">Practice</span><p>Exercises with automatic checks. Write your code, press <strong>Check answer</strong>, and fix whatever fails. Hints and solutions are there if you get stuck.</p></div>
        </div>
      </section>

      <section class="plan" id="plan">
        <h2>The plan</h2>
        <div class="weeks"></div>
      </section>

      <section class="tips">
        <h2>Making three hours a week count</h2>
        <ul>
          <li><strong>Type the code yourself.</strong> Copying teaches your eyes; typing teaches your fingers and shows you the mistakes you actually make.</li>
          <li><strong>Break things on purpose.</strong> Change a sample, predict what will happen, then press Run. Being wrong and seeing why is how it sticks.</li>
          <li><strong>Spread the hours out.</strong> Three one-hour sessions beat one three-hour session. Start each session by redoing one exercise from last time.</li>
          <li><strong>Stuck for 15 minutes?</strong> Take a hint, then the solution. Read the solution, close it, and write it again from memory.</li>
        </ul>
        <p class="small muted">Your progress and code are saved in this browser only.</p>
      </section>
    </div>`);
    const weeks = v.querySelector(".weeks");
    for (const w of WEEKS) {
      const lessons = LESSONS.filter((l) => l.week === w.n);
      const wk = el(`<div class="week week-${w.lang}">
        <div class="week-head">
          <span class="week-num">Week ${w.n}</span>
          <span class="lang-badge lang-${w.lang}">${langName(w.lang)}</span>
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.blurb)}</p>
        </div>
        <ol class="sessions"></ol>
      </div>`);
      const ol = wk.querySelector(".sessions");
      for (const l of lessons) {
        const exN = exercisesOf(l).length;
        const p = passedCount(l);
        ol.appendChild(el(`<li class="session ${state.done[l.id] ? "is-done" : ""}">
          <a href="#${l.id}">
            <span class="session-check" aria-hidden="true">${state.done[l.id] ? "✓" : l.session}</span>
            <span class="session-main">
              <span class="session-kicker">Session ${l.session} · about ${l.minutes} min</span>
              <span class="session-title">${esc(l.title)}</span>
              <span class="session-sum">${l.summary}</span>
            </span>
            <span class="session-ex">${p}/${exN}<small>exercises</small></span>
          </a>
        </li>`));
      }
      weeks.appendChild(wk);
    }
    return v;
  }

  function lessonHeader(l, mode) {
    const i = lessonIndex(l.id);
    const tab = (m, label) => `<a role="tab" aria-selected="${mode === m}" class="tab ${mode === m ? "active" : ""}" href="#${l.id}-${m}">${label}</a>`;
    return `<header class="lesson-head">
      <nav class="crumbs"><a href="#home">Plan</a><span aria-hidden="true">/</span><span>Week ${l.week} · Session ${l.session}</span></nav>
      <div class="lesson-title-row">
        <span class="lang-badge lang-${l.lang}">${langName(l.lang)}</span>
        <span class="muted small">About ${l.minutes} minutes</span>
        ${state.done[l.id] ? '<span class="done-pill">Completed</span>' : ""}
      </div>
      <h1>${esc(l.title)}</h1>
      <p class="lede">${l.summary}</p>
      <div class="tabs" role="tablist">${tab("guide", "Guide")}${tab("slides", "Slides")}${tab("practice", `Practice <span class="tab-count">${passedCount(l)}/${exercisesOf(l).length}</span>`)}</div>
    </header>`;
  }

  function lessonFooter(l) {
    const i = lessonIndex(l.id);
    const prev = LESSONS[i - 1];
    const next = LESSONS[i + 1];
    const f = el(`<footer class="lesson-foot">
      <div class="complete-box">
        <div>
          <strong>${state.done[l.id] ? "This session is marked complete." : "Finished the guide and the exercises?"}</strong>
          <p class="muted small">${passedCount(l)} of ${exercisesOf(l).length} exercises passed.</p>
        </div>
        <button type="button" class="btn ${state.done[l.id] ? "ghost" : "run"}" data-act="done">${state.done[l.id] ? "Mark as not complete" : "Mark session complete"}</button>
      </div>
      <div class="pager">
        ${prev ? `<a class="pager-link" href="#${prev.id}"><span class="muted small">Previous</span>${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="pager-link next" href="#${next.id}"><span class="muted small">Next</span>${esc(next.title)}</a>` : `<a class="pager-link next" href="#playground"><span class="muted small">Next</span>Playground</a>`}
      </div>
    </footer>`);
    f.querySelector('[data-act="done"]').onclick = () => {
      state.done[l.id] = !state.done[l.id];
      save();
      route();
      if (state.done[l.id] && next) window.scrollTo({ top: document.body.scrollHeight });
    };
    return f;
  }

  function viewGuide(l) {
    const v = el(`<div class="lesson mode-guide">${lessonHeader(l, "guide")}<article class="guide prose"></article></div>`);
    const art = v.querySelector(".guide");
    art.appendChild(el(`<div class="goals"><h2>In this session you will</h2><ul>${l.goals.map((g) => `<li>${g}</li>`).join("")}</ul></div>`));
    let stepN = 0;
    let quizN = 0;
    for (const s of l.sections) {
      if (s.type === "step") {
        stepN++;
        art.appendChild(el(`<section class="g-step"><h2><span class="step-n">${stepN}</span>${esc(s.title)}</h2>${s.html}</section>`));
      } else if (s.type === "quiz") {
        quizN++;
        art.appendChild(quizWidget(s, quizN));
      }
    }
    const exs = exercisesOf(l);
    art.appendChild(el(`<section class="g-step practice-cta">
      <h2>Now practise</h2>
      <p>${exs.length} exercises are waiting. Each one checks your answer automatically.</p>
      <ul class="ex-list">${exs.map((e) => `<li><a href="#${l.id}-practice">${esc(e.title)}</a>${state.passed[e.id] ? ' <span class="done-pill">Passed</span>' : ""}</li>`).join("")}</ul>
      <p><a class="btn run" href="#${l.id}-practice">Go to the exercises</a></p>
    </section>`));
    enhance(art);
    v.appendChild(lessonFooter(l));
    return v;
  }

  function viewPractice(l) {
    const v = el(`<div class="lesson mode-practice">${lessonHeader(l, "practice")}<div class="practice"></div></div>`);
    const box = v.querySelector(".practice");
    box.appendChild(el(`<p class="practice-intro">Write your answer in the editor and press <strong>Check answer</strong>. Your code is saved as you type. ${l.lang === "ts" ? "TypeScript exercises also need to be free of type errors to pass." : ""}</p>`));
    for (const ex of exercisesOf(l)) box.appendChild(exerciseWidget(ex, l));
    v.appendChild(lessonFooter(l));
    return v;
  }

  let slideKeyHandler = null;
  function viewSlides(l) {
    const v = el(`<div class="lesson mode-slides">${lessonHeader(l, "slides")}
      <div class="deck">
        <div class="deck-progress" aria-hidden="true"></div>
        <div class="deck-stage"></div>
        <div class="deck-nav">
          <button type="button" class="btn ghost" data-act="prev">← Back</button>
          <span class="deck-count" aria-live="polite"></span>
          <button type="button" class="btn run" data-act="next">Next →</button>
        </div>
        <p class="deck-keys muted small">Tip: use the ← and → keys to move between slides.</p>
      </div>
    </div>`);
    const stage = v.querySelector(".deck-stage");
    const bar = v.querySelector(".deck-progress");
    const slides = [];

    slides.push(el(`<section class="slide slide-title">
      <p class="eyebrow">Week ${l.week} · Session ${l.session}</p>
      <h2>${esc(l.title)}</h2>
      <p class="lede">${l.summary}</p>
      <div class="goals"><h3>You will</h3><ul>${l.goals.map((g) => `<li>${g}</li>`).join("")}</ul></div>
    </section>`));
    let quizN = 0;
    let exN = 0;
    const exTotal = exercisesOf(l).length;
    for (const s of l.sections) {
      if (s.type === "step") {
        slides.push(el(`<section class="slide prose"><h2>${esc(s.title)}</h2>${s.html}</section>`));
      } else if (s.type === "quiz") {
        const sl = el(`<section class="slide slide-quiz"></section>`);
        sl.appendChild(quizWidget(s, ++quizN));
        slides.push(sl);
      } else if (s.type === "exercise") {
        const sl = el(`<section class="slide slide-ex"><p class="eyebrow">Practice ${++exN} of ${exTotal}</p></section>`);
        sl.appendChild(exerciseWidget(s, l));
        slides.push(sl);
      }
    }
    const i = lessonIndex(l.id);
    const next = LESSONS[i + 1];
    const end = el(`<section class="slide slide-title">
      <p class="eyebrow">End of session</p>
      <h2>Session complete?</h2>
      <p class="lede">If the exercises passed, mark this session done and take a break. Next time, start by redoing one exercise from memory.</p>
      <div class="hero-actions">
        <button type="button" class="btn run big" data-act="done">${state.done[l.id] ? "Marked complete ✓" : "Mark session complete"}</button>
        ${next ? `<a class="btn ghost big" href="#${next.id}">Next: ${esc(next.title)}</a>` : ""}
      </div>
    </section>`);
    end.querySelector('[data-act="done"]').onclick = (e) => {
      state.done[l.id] = true;
      save();
      e.currentTarget.textContent = "Marked complete ✓";
    };
    slides.push(end);

    slides.forEach((s) => { s.hidden = true; stage.appendChild(s); });
    bar.innerHTML = slides.map((_, k) => `<span data-k="${k}"></span>`).join("");
    enhance(stage);

    let cur = Math.min(state.slide[l.id] || 0, slides.length - 1);
    const show = (k) => {
      cur = Math.max(0, Math.min(slides.length - 1, k));
      slides.forEach((s, j) => (s.hidden = j !== cur));
      bar.querySelectorAll("span").forEach((s, j) => s.classList.toggle("on", j <= cur));
      v.querySelector(".deck-count").textContent = `${cur + 1} / ${slides.length}`;
      v.querySelector('[data-act="prev"]').disabled = cur === 0;
      const nb = v.querySelector('[data-act="next"]');
      nb.disabled = cur === slides.length - 1;
      state.slide[l.id] = cur;
      save();
      refreshers.forEach((r) => r.refresh());
    };
    const go = (d) => {
      show(cur + d);
      const top = v.querySelector(".deck").getBoundingClientRect().top + window.scrollY - 80;
      if (window.scrollY > top) window.scrollTo({ top });
    };
    v.querySelector('[data-act="prev"]').onclick = () => go(-1);
    v.querySelector('[data-act="next"]').onclick = () => go(1);
    bar.addEventListener("click", (e) => { const k = e.target.dataset.k; if (k !== undefined) show(Number(k)); });
    slideKeyHandler = (e) => {
      const t = e.target;
      if (t.closest && (t.closest(".CodeMirror") || /INPUT|TEXTAREA|SELECT/.test(t.tagName))) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    };
    document.addEventListener("keydown", slideKeyHandler);
    requestAnimationFrame(() => show(cur));
    return v;
  }

  const PLAY_SAMPLE = {
    js: `// A scratchpad for JavaScript. Change anything and press Run.
const names = ["Ada", "Grace", "Linus"];

for (const name of names) {
  console.log(\`Hello, \${name}!\`);
}

const lengths = names.map((n) => n.length);
console.log(lengths);
`,
    ts: `// A scratchpad for TypeScript. Type errors show up when you press Run.
interface Book {
  title: string;
  pages: number;
}

function describe(book: Book): string {
  return \`\${book.title} has \${book.pages} pages\`;
}

const shelf: Book[] = [
  { title: "Dune", pages: 412 },
  { title: "Emma", pages: 474 },
];

shelf.forEach((b) => console.log(describe(b)));
`,
  };

  function viewPlayground() {
    setTitle("Playground");
    const play = state.play || { lang: "ts", code: { js: PLAY_SAMPLE.js, ts: PLAY_SAMPLE.ts } };
    const v = el(`<div class="playground">
      <header class="lesson-head">
        <nav class="crumbs"><a href="#home">Plan</a><span aria-hidden="true">/</span><span>Playground</span></nav>
        <h1>Playground</h1>
        <p class="lede">Try anything here. Your code is kept in this browser between visits.</p>
        <div class="tabs" role="tablist">
          <button type="button" role="tab" class="tab" data-lang="js">JavaScript</button>
          <button type="button" role="tab" class="tab" data-lang="ts">TypeScript</button>
        </div>
      </header>
      <div class="play-host"></div>
    </div>`);
    const host = v.querySelector(".play-host");
    const mount = () => {
      host.innerHTML = "";
      v.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.lang === play.lang);
        t.setAttribute("aria-selected", t.dataset.lang === play.lang);
      });
      const lang = play.lang;
      const w = el(`<div class="runner runner-play">
        <div class="runner-bar">
          <span class="lang-badge lang-${lang}">${langName(lang)}</span>
          <span class="runner-hint">${runKey} to run</span>
          <button type="button" class="btn ghost small" data-act="reset">Reset sample</button>
          <button type="button" class="btn run small" data-act="run"><span aria-hidden="true">▶</span> Run</button>
        </div>
        <div class="runner-editor"></div>
        <div class="runner-out" hidden aria-live="polite"></div>
      </div>`);
      host.appendChild(w);
      const outBox = w.querySelector(".runner-out");
      const out = makeOutput(outBox);
      out.box = () => outBox;
      const run = () => execute({ code: ed.get(), lang, out });
      const ed = makeEditor(w.querySelector(".runner-editor"), play.code[lang], lang, run, (val) => {
        play.code[lang] = val;
        state.play = play;
        save();
      });
      w.querySelector('[data-act="run"]').onclick = run;
      w.querySelector('[data-act="reset"]').onclick = () => { ed.set(PLAY_SAMPLE[lang]); };
      refreshers.add(ed);
    };
    v.querySelectorAll(".tab").forEach((t) => (t.onclick = () => { play.lang = t.dataset.lang; state.play = play; save(); mount(); }));
    mount();
    return v;
  }

  // ---------------------------------------------------------------- router
  function route() {
    if (slideKeyHandler) { document.removeEventListener("keydown", slideKeyHandler); slideKeyHandler = null; }
    refreshers.clear();
    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    let view;
    let scrollTop = true;
    if (hash === "playground") view = viewPlayground();
    else {
      const m = hash.match(/^(.*?)(?:-(guide|slides|practice))?$/);
      const lesson = m && LESSONS.find((l) => l.id === m[1]);
      if (lesson) {
        const mode = m[2] || state.mode || "guide";
        state.mode = mode;
        save();
        setTitle(lesson.title);
        view = mode === "slides" ? viewSlides(lesson) : mode === "practice" ? viewPractice(lesson) : viewGuide(lesson);
        if (lastLesson === lesson.id) scrollTop = false;
        lastLesson = lesson.id;
      } else {
        view = viewHome();
        lastLesson = null;
        if (hash === "plan") requestAnimationFrame(() => document.getElementById("plan")?.scrollIntoView());
      }
    }
    if (!hash.match(/^(.*?)(?:-(guide|slides|practice))?$/) || hash === "playground") lastLesson = null;
    app.innerHTML = "";
    app.appendChild(view);
    document.querySelectorAll(".topnav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + (hash || "home")));
    if (scrollTop && hash !== "plan") window.scrollTo(0, 0);
    requestAnimationFrame(() => refreshers.forEach((r) => r.refresh()));
  }
  let lastLesson = null;

  // Fonts can change line heights after load; let editors re-measure.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => refreshers.forEach((r) => r.refresh()));

  window.addEventListener("hashchange", route);
  document.addEventListener("progress", () => {
    document.querySelectorAll(".tab-count").forEach((n) => {
      const l = LESSONS.find((x) => location.hash.includes(x.id));
      if (l) n.textContent = `${passedCount(l)}/${exercisesOf(l).length}`;
    });
  });
  route();
})();
