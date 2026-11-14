// Optional account sign-in (emailed link) and progress sync across devices.
// Progress is always saved in the browser first; when signed in it is also merged
// with the copy stored in Supabase, so nothing is lost when devices disagree.
(function () {
  "use strict";

  const KINDS = ["done", "passed", "code"];

  /**
   * Merge two progress snapshots. For every item the newest change wins
   * (by its timestamp in `stamps`), except passed exercises, which stay passed.
   */
  function merge(a, b) {
    a = a || {};
    b = b || {};
    const sa = a.stamps || {};
    const sb = b.stamps || {};
    const out = { done: {}, passed: {}, code: {}, stamps: {} };
    for (const kind of KINDS) {
      const va = a[kind] || {};
      const vb = b[kind] || {};
      const ids = new Set([...Object.keys(va), ...Object.keys(vb)]);
      for (const k of Object.keys(sa)) if (k.startsWith(kind + ":")) ids.add(k.slice(kind.length + 1));
      for (const k of Object.keys(sb)) if (k.startsWith(kind + ":")) ids.add(k.slice(kind.length + 1));
      for (const id of ids) {
        const key = `${kind}:${id}`;
        const ta = sa[key] || 0;
        const tb = sb[key] || 0;
        let value;
        if (kind === "passed") value = va[id] || vb[id] || undefined;
        else value = tb > ta ? vb[id] : ta > tb ? va[id] : va[id] !== undefined ? va[id] : vb[id];
        if (value !== undefined && value !== false) out[kind][id] = value;
        const t = Math.max(ta, tb);
        if (t) out.stamps[key] = t;
      }
    }
    return out;
  }

  const cfg = window.STUDY_CONFIG || {};
  const enabled = !!(cfg.supabaseUrl && cfg.supabaseKey && window.supabase && window.StudyApp && /^https?:$/.test(location.protocol));
  window.Sync = { merge, changed() {}, enabled };
  if (!enabled) return;

  const btn = document.getElementById("account-btn");
  const panel = document.getElementById("account-panel");
  if (!btn || !panel) return;

  // Read an error the sign-in link may have sent back before the client clears it.
  let linkError = "";
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (params.get("error_description")) linkError = params.get("error_description").replace(/\+/g, " ");

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });

  let user = null;
  let status = "idle"; // idle | syncing | synced | offline | error
  let statusDetail = "";
  let lastSynced = 0;
  let lastPushed = "";
  let pushTimer = null;
  let running = null;
  let again = false;
  let message = linkError ? { kind: "bad", text: `That sign-in link didn't work: ${linkError}. Request a new one below.` } : null;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const progressJson = (p) => JSON.stringify({ done: p.done, passed: p.passed, code: p.code });

  function setStatus(s, detail) {
    status = s;
    statusDetail = detail || "";
    render();
  }

  async function syncNow() {
    if (!user) return;
    if (running) { again = true; return running; }
    running = (async () => {
      setStatus("syncing");
      try {
        const { data: row, error } = await client.from("progress").select("data").eq("user_id", user.id).maybeSingle();
        if (error) throw error;
        const merged = merge(window.StudyApp.getProgress(), row ? row.data : null);
        window.StudyApp.applyProgress(merged);
        const json = progressJson(merged);
        if (!row || progressJson(row.data) !== json || JSON.stringify(row.data.stamps || {}) !== JSON.stringify(merged.stamps)) {
          const { error: upErr } = await client
            .from("progress")
            .upsert({ user_id: user.id, data: merged, updated_at: new Date().toISOString() });
          if (upErr) throw upErr;
        }
        lastPushed = json;
        lastSynced = Date.now();
        setStatus("synced");
      } catch (e) {
        if (!navigator.onLine) setStatus("offline");
        else setStatus("error", (e && e.message) || "Unknown error");
      }
    })();
    try { await running; } finally {
      running = null;
      if (again) { again = false; syncNow(); }
    }
  }

  window.Sync.changed = function () {
    if (!user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      if (progressJson(window.StudyApp.getProgress()) !== lastPushed) syncNow();
    }, 1500);
  };

  client.auth.onAuthStateChange((event, session) => {
    const wasSignedIn = !!user;
    user = session ? session.user : null;
    if (user && !wasSignedIn) {
      message = null;
      if (event === "SIGNED_IN") history.replaceState(null, "", location.pathname + location.search);
      setTimeout(syncNow, 0); // don't call Supabase inside this callback
    }
    if (!user) setStatus("idle");
    render();
  });

  let lastFocusSync = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && user && Date.now() - lastFocusSync > 15000) {
      lastFocusSync = Date.now();
      syncNow();
    }
  });
  window.addEventListener("online", () => user && syncNow());

  // ------------------------------------------------------------------ UI
  function statusText() {
    if (status === "syncing") return "Syncing…";
    if (status === "synced") return `Synced ${new Date(lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (status === "offline") return "No connection. Changes are saved on this device and will sync later.";
    if (status === "error") return `Couldn't sync (${statusDetail}). Your progress is still saved on this device.`;
    return "";
  }

  function render() {
    btn.hidden = false;
    btn.classList.toggle("signed-in", !!user);
    btn.classList.toggle("has-problem", status === "error" || status === "offline");
    btn.textContent = user ? "Account" : "Sign in";
    if (panel.hidden) return;
    if (user) {
      panel.innerHTML = `
        <p class="acct-title">Signed in</p>
        <p class="acct-email">${esc(user.email || "")}</p>
        <p class="acct-status acct-${status}" aria-live="polite">${esc(statusText())}</p>
        <p class="muted small">Your sessions, passed exercises and exercise code sync to every device where you sign in.</p>
        <div class="acct-actions">
          <button type="button" class="btn small" data-act="sync">Sync now</button>
          <button type="button" class="btn ghost small" data-act="signout">Sign out</button>
        </div>`;
      panel.querySelector('[data-act="sync"]').onclick = () => syncNow();
      panel.querySelector('[data-act="signout"]').onclick = async () => {
        await client.auth.signOut();
        message = { kind: "ok", text: "Signed out. Your progress is still saved in this browser." };
        render();
      };
    } else {
      panel.innerHTML = `
        <p class="acct-title">Sync your progress</p>
        <p class="muted small">Optional. Sign in to keep your progress and exercise code in step across your phone and computer. Without an account, progress is saved in this browser only.</p>
        <form class="acct-form" novalidate>
          <label for="acct-email-input">Email</label>
          <input id="acct-email-input" type="email" autocomplete="email" inputmode="email" required placeholder="you@example.com">
          <button type="submit" class="btn run small">Email me a sign-in link</button>
        </form>
        ${message ? `<p class="acct-msg acct-msg-${message.kind}" aria-live="polite">${esc(message.text)}</p>` : ""}
        <p class="muted small">No password needed. Open the link on the device you want to sign in on.</p>`;
      const form = panel.querySelector("form");
      const input = panel.querySelector("input");
      form.onsubmit = async (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          message = { kind: "bad", text: "Enter a full email address, like name@example.com." };
          render();
          panel.querySelector("input").value = email;
          return;
        }
        const submit = form.querySelector("button");
        submit.disabled = true;
        submit.textContent = "Sending…";
        const { error } = await client.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: location.origin + location.pathname },
        });
        message = error
          ? { kind: "bad", text: `Couldn't send the link: ${error.message}` }
          : { kind: "ok", text: `Check ${email} for a sign-in link. It can take a minute to arrive; look in spam too.` };
        render();
      };
    }
  }

  function openPanel(open) {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    render();
    if (open) {
      const first = panel.querySelector("input, button");
      if (first) first.focus();
    }
  }
  btn.addEventListener("click", () => openPanel(panel.hidden));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { openPanel(false); btn.focus(); } });
  document.addEventListener("click", (e) => {
    const path = e.composedPath ? e.composedPath() : [e.target];
    if (!panel.hidden && !path.includes(panel) && !path.includes(btn)) openPanel(false);
  });

  render();
  if (linkError) openPanel(true);
})();
