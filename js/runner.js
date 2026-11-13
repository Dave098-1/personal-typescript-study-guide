// Code runner: executes learner code in a Web Worker (so infinite loops can be stopped),
// captures console output, runs exercise tests, and compiles/type-checks TypeScript.
(function () {
  "use strict";

  const TS_VERSION = "5.6.3";
  const TS_URL = `https://cdn.jsdelivr.net/npm/typescript@${TS_VERSION}/lib/typescript.js`;

  // ---------------------------------------------------------------------------
  // Everything inside `core` runs inside the worker (or inline as a fallback).
  function core(post) {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const LINE_OFFSET = 2; // V8 wraps Function bodies in two header lines

    function inspect(value, depth, seen) {
      depth = depth || 0;
      seen = seen || new Set();
      const t = typeof value;
      if (value === null) return "null";
      if (t === "undefined") return "undefined";
      if (t === "string") return depth === 0 ? value : JSON.stringify(value).replace(/^"|"$/g, "'").replace(/\\"/g, '"');
      if (t === "number" || t === "boolean") return String(value);
      if (t === "bigint") return value + "n";
      if (t === "symbol") return value.toString();
      if (t === "function") {
        if (/^class[\s{]/.test(Function.prototype.toString.call(value))) return `[class ${value.name || "(anonymous)"}]`;
        return `[Function: ${value.name || "(anonymous)"}]`;
      }
      if (value instanceof Error) return `${value.name}: ${value.message}`;
      if (value instanceof Date) return value.toISOString();
      if (value instanceof RegExp) return String(value);
      if (typeof Promise !== "undefined" && value instanceof Promise) return "Promise { <pending> }";
      if (seen.has(value)) return "[Circular]";
      if (depth > 3) return Array.isArray(value) ? "[Array]" : "[Object]";
      seen.add(value);
      let out;
      if (Array.isArray(value)) {
        const items = value.map((v) => inspect(v, depth + 1, seen));
        out = items.length ? `[ ${items.join(", ")} ]` : "[]";
      } else if (value instanceof Map) {
        const items = [...value].map(([k, v]) => `${inspect(k, depth + 1, seen)} => ${inspect(v, depth + 1, seen)}`);
        out = `Map(${value.size}) { ${items.join(", ")} }`;
      } else if (value instanceof Set) {
        const items = [...value].map((v) => inspect(v, depth + 1, seen));
        out = `Set(${value.size}) { ${items.join(", ")} }`;
      } else {
        const proto = Object.getPrototypeOf(value);
        const name = proto && proto !== Object.prototype && proto.constructor ? proto.constructor.name + " " : "";
        const keys = Object.keys(value);
        const items = keys.map((k) => {
          const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
          return `${key}: ${inspect(value[k], depth + 1, seen)}`;
        });
        out = items.length ? `${name}{ ${items.join(", ")} }` : `${name}{}`;
      }
      seen.delete(value);
      if (out.length > 72 && depth === 0) {
        // pretty print long values over several lines
        try {
          if (!(value instanceof Map) && !(value instanceof Set))
            out = JSON.stringify(value, null, 2).replace(/"([A-Za-z_$][\w$]*)":/g, "$1:");
        } catch (e) { /* keep single line */ }
      }
      return out;
    }

    function lineOf(err) {
      const m = String((err && err.stack) || "").match(/<anonymous>:(\d+):(\d+)/);
      return m ? Number(m[1]) - LINE_OFFSET : null;
    }
    function formatError(err) {
      if (!(err instanceof Error)) return "Uncaught " + inspect(err, 1);
      const line = lineOf(err);
      return `${err.name}: ${err.message}` + (line && line > 0 ? `  (line ${line})` : "");
    }

    function deepEqual(a, b) {
      if (Object.is(a, b)) return true;
      if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      if (a instanceof Map && b instanceof Map) return a.size === b.size && [...a].every(([k, v]) => b.has(k) && deepEqual(v, b.get(k)));
      if (a instanceof Set && b instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v));
      const ka = Object.keys(a), kb = Object.keys(b);
      return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
    }

    function expect(actual) {
      const show = (v) => inspect(v, 1);
      const fail = (msg) => { throw new Error(msg); };
      const api = {
        toBe: (exp) => Object.is(actual, exp) || fail(`expected ${show(exp)}, got ${show(actual)}`),
        toEqual: (exp) => deepEqual(actual, exp) || fail(`expected ${show(exp)}, got ${show(actual)}`),
        toBeTruthy: () => !!actual || fail(`expected a truthy value, got ${show(actual)}`),
        toBeFalsy: () => !actual || fail(`expected a falsy value, got ${show(actual)}`),
        toBeType: (type) => typeof actual === type || fail(`expected a ${type}, got ${typeof actual} (${show(actual)})`),
        toContain: (x) => (actual != null && actual.includes(x)) || fail(`expected ${show(actual)} to contain ${show(x)}`),
        toBeCloseTo: (x, d = 2) => Math.abs(actual - x) < Math.pow(10, -d) / 2 || fail(`expected about ${x}, got ${show(actual)}`),
        toBeGreaterThan: (x) => actual > x || fail(`expected more than ${x}, got ${show(actual)}`),
        toBeInstanceOf: (C) => actual instanceof C || fail(`expected an instance of ${C.name}`),
        toThrow: (text) => {
          try { actual(); } catch (e) {
            if (text && !String(e && e.message).includes(text)) fail(`expected error mentioning "${text}", got "${e && e.message}"`);
            return true;
          }
          fail("expected the function to throw an error, but it did not");
        },
      };
      return api;
    }

    return async function handle({ code, tests }) {
      const logs = [];
      const send = (kind, args) => {
        const text = args.map((a) => inspect(a)).join(" ");
        logs.push(text);
        post({ type: "log", kind, text });
      };
      const fakeConsole = {
        log: (...a) => send("log", a),
        info: (...a) => send("log", a),
        debug: (...a) => send("log", a),
        warn: (...a) => send("warn", a),
        error: (...a) => send("error", a),
        table: (d) => send("log", [d]),
      };

      const timers = new Set();
      const _setTimeout = (fn, ms, ...args) => {
        const id = setTimeout(() => {
          timers.delete(id);
          try { fn(...args); } catch (e) { post({ type: "error", text: formatError(e) }); }
        }, ms);
        timers.add(id);
        return id;
      };
      const _clearTimeout = (id) => { timers.delete(id); clearTimeout(id); };
      const _setInterval = (fn, ms, ...args) => {
        const id = setInterval(() => {
          try { fn(...args); } catch (e) { post({ type: "error", text: formatError(e) }); }
        }, ms);
        timers.add(id);
        return id;
      };
      const _clearInterval = (id) => { timers.delete(id); clearInterval(id); };
      const idle = () => new Promise((resolve) => {
        const check = () => (timers.size === 0 ? setTimeout(() => (timers.size === 0 ? resolve() : check()), 0) : setTimeout(check, 10));
        check();
      });

      const queue = [];
      const test = (name, fn) => queue.push({ name, fn });

      let crashed = false;
      try {
        const fn = new AsyncFunction(
          "console", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "test", "expect", "$logs",
          '"use strict";' + code + "\n;\n" + (tests || "")
        );
        await fn(fakeConsole, _setTimeout, _clearTimeout, _setInterval, _clearInterval, test, expect, logs);
      } catch (e) {
        crashed = true;
        post({ type: "error", text: formatError(e) });
      }
      await idle();

      const results = [];
      for (const t of queue) {
        try {
          await t.fn();
          results.push({ name: t.name, pass: true });
        } catch (e) {
          results.push({ name: t.name, pass: false, message: e && e.message ? e.message : String(e) });
        }
      }
      await idle();
      post({ type: "done", results, crashed, hadTests: !!tests });
    };
  }

  // ---------------------------------------------------------------------------
  let workerUrl = null;
  function makeWorker() {
    if (!workerUrl) {
      const src = `const handle = (${core.toString()})((m) => postMessage(m));
self.onmessage = (e) => handle(e.data);
self.addEventListener("unhandledrejection", (e) => { e.preventDefault(); const r = e.reason; postMessage({ type: "error", text: "Uncaught (in promise) " + (r && r.message ? (r.name || "Error") + ": " + r.message : String(r)) }); });`;
      workerUrl = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
    }
    return new Worker(workerUrl);
  }

  let workersOk = typeof Worker !== "undefined";

  /** Run JavaScript. onEvent receives {type:'log'|'error', ...}. Resolves with {results, crashed, timedOut}. */
  function runJS(code, tests, onEvent, timeoutMs) {
    timeoutMs = timeoutMs || 5000;
    return new Promise((resolve) => {
      let finished = false;
      const finish = (r) => { if (!finished) { finished = true; resolve(r); } };
      const onMsg = (m) => {
        if (m.type === "done") finish(m);
        else onEvent(m);
      };
      let worker = null;
      if (workersOk) {
        try { worker = makeWorker(); } catch (e) { workersOk = false; }
      }
      if (worker) {
        const timer = setTimeout(() => {
          worker.terminate();
          onEvent({ type: "error", text: `Stopped after ${timeoutMs / 1000} seconds. Is there an infinite loop, or a setInterval that is never cleared?` });
          finish({ results: [], crashed: true, timedOut: true, hadTests: !!tests });
        }, timeoutMs);
        worker.onmessage = (e) => {
          onMsg(e.data);
          if (e.data.type === "done") { clearTimeout(timer); worker.terminate(); }
        };
        worker.onerror = (e) => {
          e.preventDefault();
          onEvent({ type: "error", text: e.message || "Error in worker" });
        };
        worker.postMessage({ code, tests });
      } else {
        // Fallback: run on the page itself (no protection against infinite loops).
        core(onMsg)({ code, tests });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // TypeScript support (loaded on first use)
  let tsPromise = null;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Could not load " + src));
      document.head.appendChild(s);
    });
  }
  function loadTS() {
    if (!tsPromise) {
      const libsSrc = (window.STUDY_BASE || "") + "vendor/ts-libs.js";
      tsPromise = Promise.all([window.ts ? null : loadScript(TS_URL), window.TS_LIBS ? null : loadScript(libsSrc)]).then(() => {
        if (!window.ts || !window.TS_LIBS) throw new Error("TypeScript failed to load");
        return window.ts;
      });
      tsPromise.catch(() => { tsPromise = null; });
    }
    return tsPromise;
  }

  const GLOBALS = `
declare var console: { log(...data: any[]): void; info(...data: any[]): void; warn(...data: any[]): void; error(...data: any[]): void; debug(...data: any[]): void; table(data: any): void; };
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id: number | undefined): void;
declare function structuredClone<T>(value: T): T;
`;

  const libCache = new Map();
  let oldProgram;
  function typeCheck(ts, code) {
    const opts = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      strict: true,
      noLib: true,
      noEmit: true,
      skipLibCheck: true,
      noFallthroughCasesInSwitch: true,
      useDefineForClassFields: true,
    };
    const MAIN = "/main.ts";
    const files = { [MAIN]: code + "\nexport {};\n", "/globals.d.ts": GLOBALS };
    for (const name of Object.keys(window.TS_LIBS)) files["/" + name] = window.TS_LIBS[name];
    const host = {
      getSourceFile(name, lang) {
        const text = files[name];
        if (text === undefined) return undefined;
        if (name !== MAIN) {
          let sf = libCache.get(name);
          if (!sf) { sf = ts.createSourceFile(name, text, lang); libCache.set(name, sf); }
          return sf;
        }
        return ts.createSourceFile(name, text, lang);
      },
      getDefaultLibFileName: () => "/lib.es5.d.ts",
      writeFile() {},
      getCurrentDirectory: () => "/",
      getCanonicalFileName: (f) => f,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      fileExists: (f) => f in files,
      readFile: (f) => files[f],
      getDirectories: () => [],
    };
    const program = ts.createProgram(Object.keys(files), opts, host, oldProgram);
    oldProgram = program;
    const sf = program.getSourceFile(MAIN);
    const diags = [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)];
    return diags.map((d) => {
      const pos = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : { line: -1, character: 0 };
      return { line: pos.line + 1, col: pos.character + 1, message: ts.flattenDiagnosticMessageText(d.messageText, "\n") };
    });
  }

  function transpile(ts, code) {
    const out = ts.transpileModule(code, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, useDefineForClassFields: true },
    });
    return out.outputText.replace(/^export \{\};\s*$/m, "").replace(/^export (?!\{)/gm, "");
  }

  /**
   * Run code in "js" or "ts". For TypeScript, type errors are reported as
   * {type:'type-error'} events before the code runs.
   * Resolves with {results, crashed, timedOut, typeErrors}.
   */
  async function run({ code, lang, tests, onEvent, timeoutMs }) {
    let js = code;
    let typeErrors = [];
    if (lang === "ts") {
      onEvent({ type: "status", text: window.ts ? "Checking types…" : "Loading the TypeScript compiler (first run only)…" });
      let ts;
      try {
        ts = await loadTS();
      } catch (e) {
        onEvent({ type: "error", text: "Could not load the TypeScript compiler. Check your internet connection and try again." });
        return { results: [], crashed: true, typeErrors: [], loadFailed: true };
      }
      typeErrors = typeCheck(ts, code);
      onEvent({ type: "status", text: "" });
      for (const d of typeErrors) onEvent({ type: "type-error", line: d.line, text: d.message });
      js = transpile(ts, code);
    }
    const r = await runJS(js, tests, onEvent, timeoutMs);
    r.typeErrors = typeErrors;
    return r;
  }

  window.Runner = { run, loadTS };
})();
