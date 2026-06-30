export const STYLES = `
.mongodocs {
  --bg: #ffffff;
  --bg-elevated: #ffffff;
  --surface: #fbfbfc;
  --surface-2: #f3f4f6;
  --surface-hover: #f1f2f4;
  --border: #e9eaee;
  --border-strong: #dcdee3;
  --text: #14181f;
  --text-2: #57606e;
  --text-3: #8b94a3;
  --accent: #0a9d6e;
  --accent-strong: #0b8f64;
  --accent-text: #07764f;
  --accent-soft: #e8f7f0;
  --accent-border: #b7e6d3;
  --topbar-bg: rgba(255,255,255,0.82);
  --code-bg: #0f1117;
  --code-border: #1c2129;
  --code-head: #11141b;
  --code-text: #c9d1d9;
  --shadow: 0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06);
  --shadow-lg: 0 12px 34px rgba(16,24,40,0.14), 0 3px 8px rgba(16,24,40,0.07);

  --tok-key:   #82aaff;
  --tok-str:   #c3e88d;
  --tok-num:   #f78c6c;
  --tok-bool:  #c792ea;
  --tok-null:  #ff6e7d;
  --tok-punct: #8b97a3;

  --tc-objectid-bg:#fef3c7; --tc-objectid-fg:#b45309;
  --tc-string-bg:#d6f5e6;   --tc-string-fg:#047857;
  --tc-number-bg:#dbeafe;   --tc-number-fg:#1d4ed8;
  --tc-boolean-bg:#ede9fe;  --tc-boolean-fg:#6d28d9;
  --tc-date-bg:#ffe4e6;     --tc-date-fg:#be123c;
  --tc-array-bg:#cffafe;    --tc-array-fg:#0e7490;
  --tc-object-bg:#e0e7ff;   --tc-object-fg:#4338ca;

  --font: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", Menlo, Consolas, monospace;

  font-family: var(--font);
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 14px;
}
.mongodocs.dark {
  --bg: #0b0e13;
  --bg-elevated: #11151c;
  --surface: #0f131a;
  --surface-2: #171c24;
  --surface-hover: #1a2029;
  --border: #1e242c;
  --border-strong: #2a313b;
  --text: #e7ecf3;
  --text-2: #9aa4b2;
  --text-3: #69727f;
  --accent: #2fd398;
  --accent-strong: #34d399;
  --accent-text: #34d399;
  --accent-soft: rgba(47,211,152,0.12);
  --accent-border: rgba(47,211,152,0.30);
  --topbar-bg: rgba(11,14,19,0.82);
  --code-bg: #0a0d12;
  --code-border: #1a1f28;
  --code-head: #0d1117;
  --shadow: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-lg: 0 16px 40px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.4);

  --tc-objectid-bg:rgba(251,191,36,0.13); --tc-objectid-fg:#fbbf24;
  --tc-string-bg:rgba(52,211,153,0.13);   --tc-string-fg:#34d399;
  --tc-number-bg:rgba(96,165,250,0.14);   --tc-number-fg:#60a5fa;
  --tc-boolean-bg:rgba(167,139,250,0.14); --tc-boolean-fg:#a78bfa;
  --tc-date-bg:rgba(251,113,133,0.14);    --tc-date-fg:#fb7185;
  --tc-array-bg:rgba(34,211,238,0.13);    --tc-array-fg:#22d3ee;
  --tc-object-bg:rgba(129,140,248,0.15);  --tc-object-fg:#818cf8;
}
.mongodocs * { box-sizing: border-box; }
.mongodocs ::selection { background: var(--accent-soft); }
.mongodocs button { font-family: inherit; }
.mongodocs button:focus-visible,
.mongodocs a:focus-visible,
.mongodocs input:focus-visible,
.mongodocs [tabindex]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 6px;
}

/* scrollbars */
.mongodocs *::-webkit-scrollbar { width: 10px; height: 10px; }
.mongodocs *::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 8px; border: 3px solid transparent; background-clip: content-box; }
.mongodocs *::-webkit-scrollbar-thumb:hover { background: var(--text-3); background-clip: content-box; }

/* ---------- top bar ---------- */
.topbar {
  position: sticky; top: 0; z-index: 40;
  height: 56px; flex-shrink: 0;
  display: flex; align-items: center; gap: 16px;
  padding: 0 16px;
  background: var(--topbar-bg);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.brand-mark {
  width: 28px; height: 28px; border-radius: 8px;
  display: grid; place-items: center;
  background: var(--accent); color: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2);
}
.brand-name { font-weight: 650; font-size: 15px; letter-spacing: -0.01em; }
.brand-name span { color: var(--accent-text); }
.hamburger {
  display: none; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 8px;
  border: 1px solid var(--border); background: transparent; color: var(--text-2); cursor: pointer;
}
.hamburger:hover { background: var(--surface-hover); color: var(--text); }

.search-wrap { position: relative; flex: 1; max-width: 460px; }
.search-input {
  width: 100%; height: 36px;
  padding: 0 12px 0 36px;
  border-radius: 9px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text);
  font-size: 13.5px;
}
.search-input::placeholder { color: var(--text-3); }
.search-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); background: var(--bg-elevated); }
.search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
.kbd-hint { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: flex; gap: 3px; }
.kbd {
  font-family: var(--mono); font-size: 11px; line-height: 1;
  padding: 3px 5px; border-radius: 5px;
  background: var(--surface-2); border: 1px solid var(--border); color: var(--text-3);
}

.search-panel {
  position: absolute; top: 46px; left: 0; right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 6px;
  z-index: 60;
  max-height: 64vh; overflow-y: auto;
}
.search-grouplabel { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); font-weight: 600; padding: 10px 10px 5px; }
.result { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; }
.result:hover { background: var(--surface-hover); }
.result-ico { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; flex-shrink: 0; background: var(--surface-2); color: var(--text-2); }
.result-ico.coll { background: var(--accent-soft); color: var(--accent-text); }
.result-body { min-width: 0; flex: 1; }
.result-title { font-family: var(--mono); font-size: 13px; color: var(--text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.result-sub { font-size: 12px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.result-kind { font-size: 10.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
.search-empty { padding: 22px 12px; text-align: center; color: var(--text-3); font-size: 13px; }

.topbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
.version-wrap { position: relative; }
.version-btn {
  display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 9px;
  border-radius: 8px; border: 1px solid var(--border); background: transparent;
  color: var(--text-2); font-size: 13px; font-weight: 500; cursor: pointer;
}
.version-btn:hover { background: var(--surface-hover); color: var(--text); }
.version-menu {
  position: absolute; top: 38px; right: 0; min-width: 160px;
  background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px;
  box-shadow: var(--shadow-lg); padding: 5px; z-index: 60;
}
.version-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 9px; border-radius: 7px; font-size: 13px; color: var(--text-2); cursor: pointer; width: 100%; background: transparent; border: none; text-align: left; }
.version-item:hover { background: var(--surface-hover); color: var(--text); }
.version-item.sel { color: var(--accent-text); font-weight: 600; }
.version-tag { font-size: 10px; color: var(--text-3); }

.icon-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text-2); cursor: pointer; display: grid; place-items: center; }
.icon-btn:hover { background: var(--surface-hover); color: var(--text); }
.avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  display: grid; place-items: center;
  font-size: 12px; font-weight: 650; letter-spacing: 0.01em;
  color: var(--accent-text);
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  cursor: pointer;
}

/* ---------- layout ---------- */
.layout { display: flex; flex: 1; min-height: 0; }
.overlay { display: none; }

.sidebar {
  width: 286px; flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: var(--surface);
  overflow-y: auto;
  padding: 16px 12px 48px;
}
.nav-group { margin-bottom: 4px; }
.nav-group-header {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 8px 9px; border-radius: 8px;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-2); font-weight: 600;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
}
.nav-group-header:hover { background: var(--surface-hover); color: var(--text); }
.nav-group-header .chev { color: var(--text-3); transition: transform 0.18s ease; flex-shrink: 0; }
.nav-group-header .seclabel { flex: 1; text-align: left; }
.nav-count { font-size: 11px; font-weight: 600; color: var(--text-3); background: var(--surface-2); border-radius: 20px; padding: 1px 8px; min-width: 22px; text-align: center; letter-spacing: 0; }
.nav-children { margin: 2px 0 6px; padding-left: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 8px; position: relative;
  width: 100%; padding: 6px 10px 6px 30px; border-radius: 8px;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-2); font-family: var(--mono); font-size: 13px;
  text-align: left;
}
.nav-item:hover { background: var(--surface-hover); color: var(--text); }
.nav-item.active { background: var(--accent-soft); color: var(--accent-text); font-weight: 600; }
.nav-item.active::before {
  content: ""; position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 15px; border-radius: 3px; background: var(--accent);
}
/* sub-collection (e.g. nodes under workflows, routing under nodes) — indents per depth */
.nav-item.child { padding-left: calc(28px + var(--ind, 1) * 16px); }
.nav-item.child::after {
  content: ""; position: absolute; left: calc(10px + var(--ind, 1) * 16px); top: -2px; width: 9px; height: 18px;
  border-left: 1.5px solid var(--border-strong);
  border-bottom: 1.5px solid var(--border-strong);
  border-bottom-left-radius: 5px;
}
.nav-item.child:hover::after, .nav-item.child.active::after { border-color: var(--accent); }

/* ---------- main ---------- */
.main { flex: 1; min-width: 0; overflow-y: auto; position: relative; scroll-behavior: smooth; }
.main-inner { max-width: 824px; margin: 0 auto; padding: 38px 44px 140px; }

.crumbs { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-3); margin-bottom: 18px; }
.crumbs .c-sep { opacity: 0.6; }
.crumbs .c-cur { color: var(--text-2); font-family: var(--mono); }

.page-title { font-family: var(--mono); font-size: 29px; font-weight: 650; letter-spacing: -0.02em; color: var(--text); margin: 0 0 8px; }
.page-desc { font-size: 15px; line-height: 1.55; color: var(--text-2); margin: 0 0 16px; max-width: 64ch; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: var(--text-2); background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 4px 10px 4px 9px; }
.chip svg { color: var(--text-3); }
.chip.mono { font-family: var(--mono); font-size: 11.5px; }
.chip.accent { color: var(--accent-text); background: var(--accent-soft); border-color: var(--accent-border); }
.chip.accent svg { color: var(--accent-text); }

.divider { height: 1px; background: var(--border); border: none; margin: 30px 0; }

.doc-section { scroll-margin-top: 20px; padding-top: 14px; }
.doc-section + .doc-section { margin-top: 38px; border-top: 1px solid var(--border); }
.sec-h { display: flex; align-items: center; gap: 9px; font-size: 18px; font-weight: 650; letter-spacing: -0.01em; color: var(--text); margin: 0 0 14px; }
.sec-h .anchor { color: var(--text-3); opacity: 0; transition: opacity 0.15s ease; }
.sec-h:hover .anchor { opacity: 1; }
.prose { font-size: 14.5px; line-height: 1.65; color: var(--text-2); margin: 0 0 16px; max-width: 68ch; }

/* overview lead card — the collection's narrative, set apart with an accent rail + icon */
.overview-card {
  position: relative;
  display: flex;
  gap: 13px;
  padding: 16px 20px 16px 19px;
  margin: 0 0 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--accent-soft) 0%, var(--surface) 64%);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.overview-card::before {
  content: "";
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--accent), var(--accent-strong));
}
.overview-ico {
  flex-shrink: 0;
  display: grid; place-items: center;
  width: 28px; height: 28px;
  border-radius: 8px;
  color: var(--accent-text);
  background: var(--bg-elevated);
  border: 1px solid var(--accent-border);
}
.overview-lead { font-size: 15px; line-height: 1.72; color: var(--text); max-width: 72ch; }
.overview-lead p { margin: 0 0 11px; }
.overview-lead p:last-child { margin-bottom: 0; }
.overview-lead .inline-link { font-weight: 550; }

/* daftar key–value (KvList) */
.kv-list { list-style: none; margin: 0 0 12px; padding: 0; }
.kv-list li { position: relative; padding: 3px 0 3px 15px; font-size: 14px; line-height: 1.55; color: var(--text-2); }
.kv-list li::before { content: "•"; position: absolute; left: 2px; color: var(--text-3); }
.kv-list strong { color: var(--text); font-weight: 600; }

/* blok perintah shell (CommandBlock) */
.cmd-block { position: relative; margin: 0 0 12px; }
.cmd-block pre {
  margin: 0;
  padding: 12px 44px 12px 14px;
  background: var(--code-bg); border: 1px solid var(--code-border);
  border-radius: 9px; overflow-x: auto;
}
.cmd-block code { font-family: var(--mono); font-size: 12.5px; color: var(--code-text); white-space: pre; }
.cmd-copy {
  position: absolute; top: 8px; right: 8px;
  display: grid; place-items: center;
  width: 26px; height: 26px;
  border: 1px solid var(--code-border); border-radius: 7px;
  background: rgba(255,255,255,0.06); color: var(--code-text);
  cursor: pointer;
}
.cmd-copy:hover { background: rgba(255,255,255,0.12); }
.cmd-copy.copied { color: var(--accent); }

/* link eksternal (DocLink) */
.doc-link {
  display: inline-flex; align-items: center; gap: 5px;
  color: var(--accent-text); font-weight: 550; text-decoration: none;
  border-bottom: 1px solid var(--accent-border);
}
.doc-link:hover { border-bottom-color: var(--accent); }

/* langkah bernomor (dokumentasi prosedur) */
.doc-steps { list-style: none; counter-reset: step; margin: 0; padding: 0; }
.doc-steps > li { position: relative; counter-increment: step; padding: 0 0 18px 42px; }
.doc-steps > li::before {
  content: counter(step);
  position: absolute; left: 0; top: 0;
  display: grid; place-items: center;
  width: 26px; height: 26px;
  border-radius: 50%;
  font-size: 13px; font-weight: 650; color: #fff;
  background: var(--accent);
}
.doc-steps > li:not(:last-child)::after {
  content: ""; position: absolute; left: 12.5px; top: 30px; bottom: 6px;
  width: 1px; background: var(--border);
}
.doc-steps > li > .prose { margin-bottom: 10px; }

/* gambar dokumentasi — bordered, caption, klik untuk zoom (lightbox) */
.doc-img { margin: 0 0 16px; }
.doc-img > img {
  max-width: 100%;
  display: block;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow);
  cursor: zoom-in;
}
.doc-img figcaption { font-size: 12.5px; color: var(--text-3); margin-top: 7px; line-height: 1.5; }
.doc-img-zoom {
  position: fixed; inset: 0; z-index: 1000;
  display: grid; place-items: center;
  padding: 40px;
  background: rgba(0,0,0,0.8);
  cursor: zoom-out;
}
.doc-img-zoom img { max-width: 95%; max-height: 95%; border-radius: 8px; box-shadow: var(--shadow-lg); }
.doc-img-close {
  position: fixed; top: 18px; right: 18px;
  display: grid; place-items: center;
  width: 34px; height: 34px;
  border: none; border-radius: 8px;
  background: rgba(255,255,255,0.14); color: #fff;
  cursor: pointer;
}
.doc-img-close:hover { background: rgba(255,255,255,0.24); }

/* process flow — left-to-right numbered cards joined by arrows; scrolls sideways on overflow */
.flow-scroll { overflow-x: auto; margin: 2px 0 16px; padding-bottom: 6px; }
.flow { display: inline-flex; align-items: stretch; gap: 10px; }
.flow-step {
  display: flex; gap: 10px; align-items: flex-start;
  flex: 0 0 auto; width: 210px;
  padding: 12px 14px;
  border: 1px solid var(--border); border-radius: 11px;
  background: linear-gradient(180deg, var(--accent-soft) 0%, var(--surface) 70%);
  box-shadow: var(--shadow);
}
.flow-num {
  flex-shrink: 0; display: grid; place-items: center;
  width: 22px; height: 22px; border-radius: 50%;
  font-size: 12px; font-weight: 650; color: #fff;
  background: var(--accent);
}
.flow-body { min-width: 0; }
.flow-title { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.38; overflow-wrap: anywhere; }
.flow-detail { font-size: 11.5px; line-height: 1.45; color: var(--text-2); margin-top: 4px; overflow-wrap: anywhere; }
.flow-detail .icode { font-size: 10.5px; overflow-wrap: anywhere; word-break: break-word; }
.flow-arrow { align-self: center; flex: 0 0 auto; color: var(--accent); }

.callout { display: flex; gap: 11px; padding: 13px 15px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); font-size: 13.5px; line-height: 1.55; color: var(--text-2); margin-bottom: 12px; }
.callout .ci { flex-shrink: 0; margin-top: 1px; }
.callout.note .ci { color: var(--text-3); }
.callout.tip { border-color: var(--accent-border); background: var(--accent-soft); color: var(--text-2); }
.callout.tip .ci { color: var(--accent-text); }
.callout.warn { border-color: #f4d2a6; background: #fdf6ec; }
.dark .callout.warn { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.08); }
.callout.warn .ci { color: #c2730b; }
.dark .callout.warn .ci { color: #fbbf24; }
.callout strong { color: var(--text); font-weight: 600; }

/* inline code */
.icode { font-family: var(--mono); font-size: 0.86em; background: var(--surface-2); border: 1px solid var(--border); padding: 1px 5px; border-radius: 5px; color: var(--text); }

/* inline clickable link (jumps to another collection) */
.inline-link { font-family: var(--mono); font-size: 0.86em; background: var(--accent-soft); border: 1px solid var(--accent-border); color: var(--accent-text); padding: 1px 5px; border-radius: 5px; cursor: pointer; }
.inline-link:hover { filter: brightness(0.97); text-decoration: underline; }

/* ---------- schema table ---------- */
.table-scroll { border: 1px solid var(--border); border-radius: 11px; overflow-x: hidden; overflow-y: auto; max-height: 420px; }
.table-x { overflow-x: auto; }
.schema-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13.5px; min-width: 640px; }
.schema-table th {
  text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--text-3); font-weight: 600; padding: 11px 16px;
  background: var(--surface); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 1;
}
.schema-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
.schema-table tbody tr:last-child td { border-bottom: none; }
.schema-table tbody tr:hover td { background: var(--surface); }
.schema-table tbody tr.schema-group-row td { background: var(--surface-2); padding: 7px 16px; }
.schema-group { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-text); }
.eg-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border); background: transparent; color: var(--text-3); cursor: pointer; }
.eg-btn:hover { background: var(--surface-hover); color: var(--accent-text); border-color: var(--accent-border); }

.eg-modal-overlay { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: rgba(8,11,16,0.5); }
.dark .eg-modal-overlay { background: rgba(0,0,0,0.62); }
.eg-modal { width: min(560px, 100%); max-height: 80vh; display: flex; flex-direction: column; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-lg); overflow: hidden; }
.eg-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 14px; background: var(--surface); border-bottom: 1px solid var(--border); }
.eg-modal-title { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--text); }
.eg-modal-close { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-2); cursor: pointer; }
.eg-modal-close:hover { background: var(--surface-hover); color: var(--text); }
.eg-modal-body { margin: 14px; padding: 14px 16px; overflow: auto; font-family: var(--mono); font-size: 12.75px; line-height: 1.7; color: var(--code-text); white-space: pre; background: var(--code-bg); border: 1px solid var(--code-border); border-radius: 10px; }

.field-cell { display: flex; align-items: center; min-height: 20px; }
.field-name { font-family: var(--mono); font-size: 13px; color: var(--text); font-weight: 500; }
.field-name.nested { color: var(--text); font-weight: 400; }
.tree-guide { position: relative; width: 16px; height: 20px; flex: 0 0 16px; }
.tree-guide::before { content: ""; position: absolute; left: 1px; top: -12px; height: 22px; width: 1.5px; background: var(--border-strong); }
.tree-guide::after { content: ""; position: absolute; left: 1px; top: 10px; width: 10px; height: 1.5px; background: var(--border-strong); }

.type-cell { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.tb { display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 11.5px; font-weight: 600; line-height: 1; padding: 3px 7px 3px 6px; border-radius: 6px; letter-spacing: 0.01em; }
.tb .dot { width: 5px; height: 5px; border-radius: 50%; }
.tb-objectid { background: var(--tc-objectid-bg); color: var(--tc-objectid-fg); } .tb-objectid .dot { background: var(--tc-objectid-fg); }
.tb-string   { background: var(--tc-string-bg);   color: var(--tc-string-fg); }   .tb-string .dot { background: var(--tc-string-fg); }
.tb-number   { background: var(--tc-number-bg);   color: var(--tc-number-fg); }   .tb-number .dot { background: var(--tc-number-fg); }
.tb-boolean  { background: var(--tc-boolean-bg);  color: var(--tc-boolean-fg); }  .tb-boolean .dot { background: var(--tc-boolean-fg); }
.tb-date     { background: var(--tc-date-bg);     color: var(--tc-date-fg); }     .tb-date .dot { background: var(--tc-date-fg); }
.tb-array    { background: var(--tc-array-bg);    color: var(--tc-array-fg); }    .tb-array .dot { background: var(--tc-array-fg); }
.tb-object   { background: var(--tc-object-bg);   color: var(--tc-object-fg); }   .tb-object .dot { background: var(--tc-object-fg); }
.type-of { font-family: var(--mono); font-size: 11.5px; color: var(--text-3); }
.enum-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.03em; font-weight: 600; }
.enum-chip { font-family: var(--mono); font-size: 11px; padding: 2px 6px; border-radius: 5px; background: var(--surface-2); color: var(--text-2); border: 1px solid var(--border); }
button.enum-chip { cursor: pointer; line-height: 1.4; }
.enum-chip.enum-link:hover { border-color: var(--accent-border); color: var(--accent-text); background: var(--accent-soft); }
.enum-chip.enum-more { color: var(--text-3); font-weight: 600; }
.enum-chip.enum-more:hover { color: var(--text); border-color: var(--border-strong); }

/* collapsible sidebar node (disclosure twisty + collapsed-children count) */
.nav-twisty { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; margin: -2px 0 -2px -6px; border-radius: 4px; color: var(--text-3); flex-shrink: 0; }
.nav-twisty:hover { background: var(--surface-2); color: var(--text); }
.nav-subcount { font-size: 10.5px; font-weight: 600; color: var(--text-3); background: var(--surface-2); border-radius: 20px; padding: 0 6px; margin-left: auto; flex-shrink: 0; letter-spacing: 0; }

.req { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; }
.req .rdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.req.required { color: var(--text-2); }
.req.required .rdot { background: var(--accent); }
.req.optional { color: var(--text-3); }
.req.optional .rdot { background: transparent; border: 1.5px solid var(--text-3); }

.desc-cell { font-size: 13px; line-height: 1.5; color: var(--text-2); }
.desc-cell.clamp { max-height: calc(1.5em * 3); overflow: hidden; }
.desc-more { margin-top: 3px; padding: 0; background: none; border: none; font-size: 12px; font-weight: 600; color: var(--accent-text); cursor: pointer; }
.desc-more:hover { text-decoration: underline; }
.desc-modal-body { margin: 0; padding: 16px 18px; overflow: auto; font-size: 13.5px; line-height: 1.7; color: var(--text); }

/* ---------- code block / json viewer ---------- */
.code-block { border-radius: 11px; overflow: hidden; border: 1px solid var(--code-border); background: var(--code-bg); box-shadow: var(--shadow); }
.code-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 10px 9px 14px; background: var(--code-head); border-bottom: 1px solid var(--code-border); }
.code-fname { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 12px; color: #9aa4b2; }
.code-fname .dots { display: flex; gap: 5px; margin-right: 4px; }
.code-fname .dots i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.copy-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #c4ccd6; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); padding: 5px 10px; border-radius: 7px; cursor: pointer; }
.copy-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.copy-btn.copied { color: #34d399; border-color: rgba(52,211,153,0.4); background: rgba(52,211,153,0.13); }
.code-body { margin: 0; padding: 16px 18px; overflow-x: auto; }
.code-body pre { margin: 0; font-family: var(--mono); font-size: 12.75px; line-height: 1.75; color: var(--code-text); white-space: pre; }
.tok-key { color: var(--tok-key); }
.tok-str { color: var(--tok-str); }
.tok-num { color: var(--tok-num); }
.tok-bool { color: var(--tok-bool); }
.tok-null { color: var(--tok-null); }
.tok-punct { color: var(--tok-punct); }

/* ---------- indexes / relations ---------- */
.kv-grid { display: grid; grid-template-columns: 1fr; gap: 22px; }
.kv-block-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
.kv-empty { font-size: 13px; color: var(--text-3); padding: 11px 14px; border: 1px dashed var(--border-strong); border-radius: 9px; background: var(--surface); margin: 0; }
.idx-row, .rel-row { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface); margin-bottom: 8px; flex-wrap: wrap; }
.idx-name { font-family: var(--mono); font-size: 13px; color: var(--text); font-weight: 500; min-width: 120px; }
.idx-keys { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.idx-badge { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; padding: 2px 7px; border-radius: 5px; }
.idx-badge.unique { color: var(--accent-text); background: var(--accent-soft); border: 1px solid var(--accent-border); }
.idx-badge.plain { color: var(--text-3); background: var(--surface-2); border: 1px solid var(--border); }
.rel-field { font-family: var(--mono); font-size: 13px; color: var(--text); min-width: 130px; }
.rel-arrow { color: var(--text-3); flex-shrink: 0; }
.rel-target { font-family: var(--mono); font-size: 13px; color: var(--accent-text); background: var(--accent-soft); border: 1px solid var(--accent-border); border-radius: 6px; padding: 2px 8px; cursor: pointer; }
.rel-target:hover { filter: brightness(0.97); }
.rel-kind { font-size: 11.5px; color: var(--text-3); margin-left: auto; }

/* ---------- right rail ---------- */
.rightrail { width: 240px; flex-shrink: 0; overflow-y: auto; padding: 40px 22px 48px; }
.rail-sticky { position: sticky; top: 0; }
.rail-title { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); font-weight: 600; margin: 0 0 10px; padding-left: 13px; }
.rail-link { display: block; width: 100%; text-align: left; padding: 6px 13px; font-size: 13px; color: var(--text-3); border-left: 2px solid var(--border); background: transparent; cursor: pointer; line-height: 1.4; }
.rail-link:hover { color: var(--text); border-left-color: var(--border-strong); }
.rail-link.active { color: var(--accent-text); border-left-color: var(--accent); font-weight: 500; }

/* ---------- footer pager (prev / next) ---------- */
.pager { display: flex; justify-content: space-between; gap: 12px; margin-top: 40px; padding-top: 22px; border-top: 1px solid var(--border); }
.pager-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 13px; border: 1px solid var(--border); border-radius: 9px;
  background: var(--surface); color: var(--text-2); cursor: pointer;
  font-size: 13px; font-weight: 500;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.pager-btn:hover { border-color: var(--accent-border); background: var(--accent-soft); color: var(--accent-text); }
.pager-btn.next { margin-left: auto; }
.pager-ico { color: var(--text-3); flex-shrink: 0; }
.pager-btn:hover .pager-ico { color: var(--accent-text); }
.pager-label { color: var(--text-3); }
.pager-title { font-family: var(--mono); font-weight: 600; color: var(--accent-text); }
.pager-btn:hover .pager-label, .pager-btn:hover .pager-title { color: var(--accent-text); }

/* ---------- restart-jar action button ---------- */
.restart-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 9px;
  border: 1px solid var(--accent-border); background: var(--accent); color: #fff;
  font-size: 13.5px; font-weight: 600; cursor: pointer;
}
.restart-btn:hover { background: var(--accent-strong); }
.restart-btn:disabled { opacity: 0.7; cursor: default; }
.restart-btn .spin { animation: mdspin 0.8s linear infinite; }
@keyframes mdspin { to { transform: rotate(360deg); } }

/* ---------- responsive ---------- */
@media (max-width: 1100px) { .rightrail { display: none; } }
@media (max-width: 820px)  { .main-inner { padding: 30px 26px 120px; } }
@media (max-width: 720px) {
  .hamburger { display: inline-flex; }
  .sidebar {
    position: absolute; top: 56px; bottom: 0; left: 0; z-index: 70;
    width: 282px; transform: translateX(-101%); transition: transform 0.24s ease;
    box-shadow: var(--shadow-lg);
  }
  .sidebar.open { transform: none; }
  .overlay { display: block; position: absolute; inset: 56px 0 0 0; background: rgba(8,11,16,0.42); z-index: 65; }
  .dark .overlay { background: rgba(0,0,0,0.6); }
  .main-inner { padding: 24px 18px 110px; }
  .page-title { font-size: 24px; }
  .search-wrap { max-width: none; }
  .version-btn .vlabel { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .mongodocs *, .mongodocs .main { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
`
