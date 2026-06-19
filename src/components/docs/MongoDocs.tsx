"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import {
    Search, ChevronRight, ChevronDown, Sun, Moon, Copy, Check, Menu, X,
    Braces, Workflow, BarChart3, Boxes, Link2, KeyRound,
    ChevronsUpDown, FileJson, Database, ArrowRight, ArrowLeft, Wrench, RotateCw,
    type LucideIcon,
} from "lucide-react"

/* ============================================================
   MongoDocs — internal data-dictionary / schema reference
   Single-file component. Mock data only, no backend.
   Content (SECTIONS / COLLECTIONS) is meant to be swapped out later.
   ============================================================ */

const STYLES = `
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
.table-scroll { border: 1px solid var(--border); border-radius: 11px; overflow: hidden; }
.table-x { overflow-x: auto; }
.schema-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13.5px; min-width: 640px; }
.schema-table th {
  text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--text-3); font-weight: 600; padding: 11px 16px;
  background: var(--surface); border-bottom: 1px solid var(--border);
  position: sticky; top: 0;
}
.schema-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
.schema-table tbody tr:last-child td { border-bottom: none; }
.schema-table tbody tr:hover td { background: var(--surface); }

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

.req { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; }
.req .rdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.req.required { color: var(--text-2); }
.req.required .rdot { background: var(--accent); }
.req.optional { color: var(--text-3); }
.req.optional .rdot { background: transparent; border: 1.5px solid var(--text-3); }

.desc-cell { font-size: 13px; line-height: 1.5; color: var(--text-2); }

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

/* ---------------- types ---------------- */
type FieldKind = "objectid" | "string" | "number" | "boolean" | "date" | "array" | "object"

interface Field {
    name: string
    kind: FieldKind
    required: boolean
    description: string
    depth?: number
    enumValues?: string[]
    of?: string
}

interface IndexDef { name: string; keys: string[]; unique: boolean; note?: string }
interface Relation { field: string; to: string; kind: string }
interface Note { kind: "note" | "tip" | "warn"; text: string }

interface Collection {
    section: string
    description: string
    long: string
    meta: { documents: string; indexed: boolean }
    notes: Note[]
    fields: Field[]
    example: unknown
    indexes: IndexDef[]
    relations: Relation[]
}

interface SectionDef { id: string; label: string; icon: LucideIcon; collections: string[] }

interface SearchItem {
    type: "collection" | "field"
    id: string
    title: string
    sub: string
    section?: string
    kind?: FieldKind
}

/* ---------------- helpers ---------------- */
const f = (
    name: string,
    kind: FieldKind,
    required: boolean,
    description: string,
    extra: Partial<Field> = {},
): Field => ({ name, kind, required, description, ...extra })

/**
 * Renders prose with two inline tokens:
 *   `code`            -> inline code chip
 *   [[id]] / [[id|label]] -> clickable link that navigates to collection `id`
 * The link is only interactive when an `onNav` callback is supplied.
 */
function renderText(text: string, onNav?: (id: string) => void): React.ReactNode {
    const nodes: React.ReactNode[] = []
    const re = /`([^`]+)`|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
    const src = String(text)
    let last = 0, m: RegExpExecArray | null, k = 0
    while ((m = re.exec(src)) !== null) {
        if (m.index > last) nodes.push(<React.Fragment key={k++}>{src.slice(last, m.index)}</React.Fragment>)
        if (m[1] != null) {
            nodes.push(<code key={k++} className="icode">{m[1]}</code>)
        } else {
            const id = m[2]
            const label = m[3] ?? m[2]
            nodes.push(
                <button key={k++} type="button" className="inline-link" onClick={() => onNav?.(id)}>{label}</button>,
            )
        }
        last = re.lastIndex
    }
    if (last < src.length) nodes.push(<React.Fragment key={k++}>{src.slice(last)}</React.Fragment>)
    return nodes
}

function highlightJson(jsonString: string): React.ReactNode[] {
    const out: React.ReactNode[] = []
    const re = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g
    let last = 0, m: RegExpExecArray | null, k = 0
    while ((m = re.exec(jsonString)) !== null) {
        if (m.index > last) out.push(<span key={k++}>{jsonString.slice(last, m.index)}</span>)
        if (m[1]) {
            const seg = m[1]
            const ci = seg.lastIndexOf('"') + 1
            out.push(<span key={k++} className="tok-key">{seg.slice(0, ci)}</span>)
            out.push(<span key={k++} className="tok-punct">{seg.slice(ci)}</span>)
        } else if (m[2]) out.push(<span key={k++} className="tok-str">{m[2]}</span>)
        else if (m[3]) out.push(<span key={k++} className="tok-bool">{m[3]}</span>)
        else if (m[4]) out.push(<span key={k++} className="tok-null">{m[4]}</span>)
        else if (m[5]) out.push(<span key={k++} className="tok-num">{m[5]}</span>)
        last = re.lastIndex
    }
    if (last < jsonString.length) out.push(<span key={k++}>{jsonString.slice(last)}</span>)
    return out
}

async function copyText(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text)
            return true
        }
    } catch { /* fall through */ }
    try {
        const ta = document.createElement("textarea")
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"
        document.body.appendChild(ta); ta.focus(); ta.select()
        document.execCommand("copy"); document.body.removeChild(ta)
        return true
    } catch { return false }
}

/* ---------------- mock data ---------------- */
const SECTIONS: SectionDef[] = [
    { id: "Workflows", label: "Workflows", icon: Workflow, collections: ["workflows", "nodes", "form", "assignment", "fields", "queryfilters", "validation", "routing", "workflow_runs"] },
    { id: "Reports", label: "Reports", icon: BarChart3, collections: ["report_definitions", "report_schedules", "report_results"] },
    { id: "Masterdata", label: "Masterdata", icon: Boxes, collections: ["users", "companies", "products", "categories"] },
    { id: "ETC", label: "ETC", icon: Wrench, collections: ["restart_jar", "validationcondition"] },
]

/** Pages that are not collection schemas — rendered with custom content. */
const CUSTOM_PAGES = new Set(["restart_jar"])

const COLLECTIONS: Record<string, Collection> = {
    workflows: {
        section: "Workflows",
        description: "Workflows adalah salah satu collection pada setiap Room di Byon yang digunakan untuk mengatur tampilan (View) aplikasi Android/APK Byon.",
        long: "Workflows merupakan salah satu collection yang terdapat pada setiap Room di Byon. Collection ini berfungsi untuk melakukan setup tampilan (View) pada aplikasi Android/APK Byon. Setiap Room dapat memiliki lebih dari satu Workflows. Oleh karena itu, Workflows juga dapat disebut sebagai Module yang dimiliki oleh masing-masing Room atau Client.",
        meta: { documents: "1.2k", indexed: true },
        notes: [
            { kind: "note", text: "Workflows dapat diurutkan berdasarkan nilai `order` yang dimilikinya. Fungsi pengurutan ini hanya berlaku apabila seluruh Workflows menggunakan `order`. Apabila terdapat Workflows yang tidak memiliki `order`, maka nilai default-nya adalah 0 (urutan paling awal)." },
            { kind: "tip", text: "Hanya `_vsb` yang berstatus `ACTIVE` yang akan ditampilkan. Untuk menonaktifkannya, ubah statusnya menjadi `PAUSED`." },
            { kind: "tip", text: "Property `notifworker` sejauh ini harus diisi dengan angka `5`. Selain nilai tersebut, fitur ini tidak akan berfungsi." },
        ],
        fields: [
            f("_id", "string", true, "Unique document identifier"),
            f("name", "string", true, "Human-readable workflow name"),
            f("notifWorker", "number", false, "Field ini dapat dihapus. Namun, apabila ingin digunakan, wajib diisi dengan angka `5`."),
            f("order", "number", false, "Apabila Workflows ingin diurutkan, maka `order` pada seluruh Workflows menjadi wajib diisi. Jika tidak diisi, nilai default-nya adalah 0 (urutan paling awal)."),
            f("_vsb", "string", true, "Hanya dapat diisi dengan `ACTIVE` atau `PAUSED`. Jika `ACTIVE`, Workflows akan ditampilkan; jika `PAUSED`, Workflows tidak akan ditampilkan.", { enumValues: ["ACTIVE", "PAUSED"] }),
            f("nodes", "array", true, "Diisi dengan kumpulan object [[nodes]].", { of: "object" }),
            f("_class", "string", true, "Wajib diisi dengan `biz.byonchat.v2.services.workflow.models.Workflow`. Apabila tidak diisi dengan nilai tersebut, project Spring Boot tidak akan mendeteksi Workflows tersebut."),
        ],
        example: {
            _id: "exampleWorkflows",
            name: "This is Workflows Example",
            notifWorker: { $numberInt: "5" },
            _vsb: "ACTIVE",
            nodes: [
                { id: "form1", name: "Nodes Example 1", "...": "..." },
                { id: "form2", name: "Nodes Example 2", "...": "..." },
                { id: "form3", name: "Nodes Example 3", "...": "..." },
            ],
            _class: "biz.byonchat.v2.services.workflow.models.Workflow",
        },
        indexes: [
            { name: "_id", keys: ["_id"], unique: true },
        ],
        relations: [
            { field: "nodes", to: "nodes", kind: "references (many)" },
        ],
    },

    nodes: {
        section: "Workflows",
        description: "Nodes adalah child dari Workflows. Setiap Workflows dapat memiliki lebih dari satu Nodes.",
        long: "Nodes merupakan child dari Workflows. Setiap Workflows dapat memiliki lebih dari satu Nodes, dan setiap Nodes dapat saling terhubung satu sama lain melalui [[routing]]. Pada Team Business, Nodes biasa disebut sebagai Tab atau FORM. Selain Tab atau [[form|FORM]], terdapat juga [[validation|Validation]] yang termasuk sebagai Nodes. Nodes merupakan kekuatan utama (power) dari BYON, dengan poin utamanya terletak pada FORM yang dinamis serta cepat untuk di-setup.",
        meta: { documents: "4.8k", indexed: true },
        notes: [
            { kind: "note", text: "Nodes dapat diurutkan berdasarkan nilai `order` yang dimilikinya. Fungsi pengurutan ini hanya berlaku apabila seluruh Nodes menggunakan `order`. Apabila terdapat Nodes yang tidak memiliki `order`, maka nilai default-nya adalah 0 (urutan paling awal)." },
        ],
        fields: [],
        example: [
            {
                id: "nodeId",
                name: "Example Name",
                iconURL: "exampleIcon",
                order: { $numberInt: "1" },
                type: "FORM",
                "...": "...",
            },
            {
                id: "nodeId2",
                name: "Example Validation",
                type: "VALIDATION",
                "...": "...",
            },
        ],
        indexes: [
            { name: "_id", keys: ["_id"], unique: true },
        ],
        relations: [],
    },

    form: {
        section: "Workflows",
        description: "FORM adalah salah satu jenis Nodes pada Workflows yang berfungsi sebagai tampilan input yang dinamis.",
        long: "FORM merupakan salah satu jenis Nodes pada Workflows. FORM menjadi inti dari kekuatan BYON karena dapat di-setup secara dinamis dan cepat.",
        meta: { documents: "—", indexed: true },
        notes: [
            { kind: "tip", text: "Dari sekian banyak field pada schema FORM, tidak semuanya wajib dipakai. Apabila sebuah field tidak dibutuhkan, field tersebut dapat dihapus saja dari dokumen." },
            { kind: "note", text: "Nodes dapat diurutkan berdasarkan nilai `order` yang dimilikinya. Fungsi pengurutan ini hanya berlaku apabila seluruh Nodes menggunakan `order`. Apabila terdapat Nodes yang tidak memiliki `order`, maka nilai default-nya adalah 0 (urutan paling awal)." },
            { kind: "warn", text: "Setiap kali mengubah `routing` atau `assignment`, Anda wajib melakukan [[restart_jar|Restart Jar]] di server. Tanpa restart, perubahan tidak akan terbaca oleh project Spring Boot." },
            { kind: "note", text: "Flag `isHidden`, `hideForApp`, dan `hideForCms` mengontrol di mana form ditampilkan tanpa menghapusnya. Contoh: form khusus CMS → `hideForApp = true`; form khusus app → `hideForCms = true`; form disembunyikan sama sekali → `isHidden = true`." },
            { kind: "note", text: "Field `locRequired`, `locPreview`, `gmapsKeyRequired`, dan `locTitle` mengontrol fitur geolocation/peta di form. `locRequired = true` → history dari app akan menyertakan lokasi user; `locPreview = true` → preview peta ditampilkan sebelum submit berhasil; `locTitle` → teks label untuk field lokasi." },
            { kind: "note", text: "Contoh `submitFilters`: field `document` tidak boleh kosong; field `amount` harus > 1000; field `approval` harus sudah dipilih. Jika salah satu kondisi tidak terpenuhi saat submit, maka submit ditolak dengan pesan error yang sesuai." },
            { kind: "note", text: "Perbedaan perilaku `sfAnd`: jika `sfAnd = null` → logika OR (jika ada satu kondisi `submitFilters` tidak terpenuhi, kembalikan error kondisi tersebut). Jika `sfAnd` diisi pesan custom → logika AND (semua kondisi harus terpenuhi; jika semua terpenuhi, kembalikan pesan `sfAnd`)." },
            { kind: "note", text: "Contoh `btnFilters`: [user adalah manager, task amount > 5000] dengan `btnFilterAnd = true` (AND) → button \"Approve\" hanya ditampilkan jika user ADALAH manager DAN amount > 5000. Pada mode OR (`btnFilterAnd = false`), cukup salah satu kondisi terpenuhi." },
        ],
        fields: [
            // --- required ---
            f("_id", "string", true, "Unique document identifier"),
            f("name", "string", true, "LABEL dari FORM/VALIDATION"),
            f("type", "string", true, "Jenis Nodes. Hanya boleh diisi dengan `FORM` atau `VALIDATION`. Untuk dokumen FORM, diisi `FORM`.", {
                enumValues: ["FORM", "VALIDATION"],
            }),
            f("submitType", "string", true, "Menentukan perilaku tombol submit. Apabila tidak diisi, default-nya `SUBMIT`. `SUBMIT`: tombol submit biasa dan task langsung masuk ke history. `PREVIEW`: ketika tombol submit diklik, akan menampilkan preview/modal konfirmasi untuk memastikan kembali data yang dibutuhkan sudah benar.", {
                enumValues: ["SUBMIT", "PREVIEW"],
            }),
            f("fields", "array", true, "List field yang menyusun isi FORM. Detail tiap field dijelaskan pada [[fields]].", { of: "object" }),
            f("iconURL", "string", true, "Menampilkan ICON untuk UI Form di Android. Nilainya berupa URL."),
            f("routing", "object", true, "Object untuk menentukan node/form tujuan setelah task disubmit dari form saat ini."),
            f("defaultDest", "object", true, "Node tujuan default.", { depth: 1 }),
            f("node", "object", true, "Node tujuan ketika form disubmit. Bersifat nullable — apabila tujuannya END (selesai), diisi `null`.", { depth: 2 }),
            f("workflowId", "string", true, "Reference ke `workflows._id`.", { depth: 3 }),
            f("nodeId", "string", true, "Reference ke `nodes.id`.", { depth: 3 }),
            f("assignment", "object", true, "Object untuk menentukan siapa yang bisa mengakses/mengerjakan task di form ini. Detail dijelaskan pada [[assignment]]."),
            f("preview", "object", true, "Konfigurasi untuk menampilkan preview task di UI. Menentukan informasi apa saja yang ditampilkan ketika user melihat preview dari task sebelum membuka detail lengkap."),
            f("title", "string", true, "Judul preview task.", { depth: 1 }),
            f("subtitle", "string", true, "Subjudul preview task.", { depth: 1 }),
            f("searches", "array", false, "List pencarian data dari form lain untuk ditampilkan.", { depth: 1, of: "object" }),
            f("formId", "string", true, "Reference ke `nodes.id`.", { depth: 2 }),
            f("key", "string", true, "Reference ke `fields.key`.", { depth: 2 }),
            f("customOffset", "object", false, "Custom offset untuk data tertentu.", { depth: 1 }),
            f("desc", "boolean", false, "Tampilkan deskripsi (`true` = ya).", { depth: 1 }),
            // --- optional ---
            f("order", "number", false, "Urutan tampil Nodes. Apabila tidak diisi, nilai default-nya adalah 0 (urutan paling awal)."),
            f("fieldsAfterSubmit", "array", false, "Isinya sama seperti [[fields]], tetapi field-field ini akan dijalankan dan nilainya didapatkan setelah form selesai disubmit.", { of: "object" }),
            f("greenBadge", "boolean", false, "Menampilkan badge hijau di Nodes sebagai indikator status positif/selesai. Apabila tidak diisi, default-nya `false`."),
            f("redBadge", "boolean", false, "Menampilkan badge merah di Nodes sebagai indikator jumlah task pending/baru. Apabila tidak diisi, default-nya `false`."),
            f("canDraft", "boolean", false, "Mengaktifkan fitur save draft. Apabila tidak diisi, default-nya `true`. Jarang dipakai karena umumnya semua form sudah bisa menyimpan draft."),
            f("isHidden", "boolean", false, "Menyembunyikan form dari tampilan umum (hidden secara global). Default-nya `false`."),
            f("hideForApp", "boolean", false, "Menyembunyikan form khusus dari mobile app. Default-nya `false`."),
            f("hideForCms", "boolean", false, "Menyembunyikan form khusus dari CMS/web dashboard. Default-nya `false`."),
            f("locRequired", "boolean", false, "User harus mengisi lokasi sebelum submit task (wajib). Default-nya `false`. Jika `true`, history dari app akan menyertakan lokasi user."),
            f("locPreview", "boolean", false, "Tampilkan preview peta (Google Maps) di form. Default-nya `false`. Jika `true`, ketika user submit akan ditampilkan preview peta terlebih dahulu sebelum submit berhasil."),
            f("gmapsKeyRequired", "boolean", false, "Muat API key Google Maps untuk fitur peta. Default-nya `false`."),
            f("locTitle", "string", false, "Label/judul untuk input lokasi — teks label untuk field lokasi pada node saat ini."),
            f("byPassTaskFrom", "string", false, "Menyimpan ID FORM lain untuk di-bypass (dilewati) ketika status task adalah pending (status = 1). Hanya dipakai bila diperlukan; nilainya wajib berupa ID dari FORM lain."),
            f("calendarKey", "string", false, "Expression/template untuk mengekstrak tanggal task guna menampilkan di calendar view. Sangat jarang dipakai dan sampai saat ini belum pernah digunakan, sehingga detailnya belum dapat dijelaskan."),
            f("showBtns", "array", false, "List tombol tambahan (AdditionalButton) yang ditampilkan. Nilainya hanya boleh diisi dari daftar di samping. Yang umum dipakai adalah `CREATE_TASK`, yaitu menampilkan tombol + (new task). Dapat dikosongkan apabila tidak ingin menampilkan tombol +.", {
                of: "string",
                enumValues: ["CREATE_TASK", "CALENDAR_VIEW", "CALENDAR_VIEW_DEFAULT", "ASSIGNMENT_VIEW", "TICKET_TASK"],
            }),
            f("mdTask", "object", false, "Membuat task yang dinamis dari master data — data task diambil dari report dengan kriteria tanggal dan parameter tertentu, bukan task statis. Contoh: form dapat mengambil data dari Report \"Sales\" untuk bulan saat ini, lalu ditampilkan sebagai task list. Sampai saat ini belum pernah dipakai di level FORM."),
            f("queryFilters", "object", false, "Bisa digunakan untuk hanya menampilkan task dengan status tertentu, priority tertentu, atau kondisi spesifik lainnya. Detail dijelaskan pada [[queryfilters]]."),
            f("submitFilters", "array", false, "List kondisi validasi yang dijalankan saat submit. Jika semua kondisi terpenuhi, submit berhasil; jika ada kondisi yang tidak terpenuhi, submit ditolak (reject) dengan pesan error. Struktur tiap object dijelaskan pada [[validationcondition]].", { of: "object" }),
            f("sfAnd", "string", false, "Submit filter AND — diisi dengan template message. Berfungsi menampilkan message (alert) ketika `submitFilters` berisi lebih dari satu object; gabungan pesannya ditampilkan di sini."),
            f("btnFilters", "array", false, "List kondisi untuk mengontrol kapan button/action ditampilkan di UI. Saat menampilkan task list, sistem mengecek apakah button harus ditampilkan. Struktur tiap object dijelaskan pada [[validationcondition]].", { of: "object" }),
            f("btnFilterAnd", "boolean", false, "Mode validasi untuk `btnFilters`: `false` → logika OR (cukup salah satu kondisi terpenuhi); `true` → logika AND (semua kondisi harus terpenuhi). Default-nya `false`."),
            f("hideInHistory", "array", false, "List berisi NodeIdentity (node/form) yang disembunyikan dari history task.", { of: "object" }),
            f("workflowId", "string", false, "Reference ke `workflows._id`.", { depth: 1 }),
            f("nodeId", "string", false, "Reference ke `nodes.id`.", { depth: 1 }),
        ],
        example: {
            _id: "exampleForm",
            name: "Example Form",
            type: "FORM",
            order: { $numberInt: "0" },
            greenBadge: false,
            redBadge: false,
            canDraft: true,
            isHidden: false,
            hideForApp: false,
            hideForCms: false,
            locRequired: false,
            locPreview: false,
            gmapsKeyRequired: false,
            locTitle: "Lokasi",
            iconURL: "exampleIconURL",
            fields: [{ key: "userInfo.name", type: "text" }],
            showBtns: ["CREATE_TASK"],
            submitType: "SUBMIT",
            routing: { defaultDest: { node: { workflowId: "workflowId", nodeId: "nodeId" } } },
            assignment: { type: "ALL" },
            preview: {
                title: "Example Title",
                subtitle: "Example Subtitle",
                desc: true,
                searches: [
                    { formId: "form1", key: "userInfo.name" },
                    { formId: "form1", key: "formData.customer" },
                ],
            },
            hideInHistory: [{ workflowId: "workflowMaintenance", nodeId: "form1" }],
            "...": "...",
        },
        indexes: [
            { name: "_id", keys: ["_id"], unique: true },
        ],
        relations: [
            { field: "nodes", to: "nodes", kind: "belongs to" },
            { field: "routing.defaultDest.node.workflowId", to: "workflows", kind: "references" },
            { field: "routing.defaultDest.node.nodeId", to: "nodes", kind: "references" },
            { field: "hideInHistory[].workflowId", to: "workflows", kind: "references" },
            { field: "hideInHistory[].nodeId", to: "nodes", kind: "references" },
            { field: "preview.searches[].formId", to: "nodes", kind: "references" },
            { field: "preview.searches[].key", to: "fields", kind: "references" },
        ],
    },

    assignment: {
        section: "Workflows",
        description: "Assignment adalah object untuk menentukan siapa yang bisa mengakses/mengerjakan task di sebuah FORM.",
        long: "Assignment merupakan turunan dari [[form|FORM]] yang menentukan siapa assignee dari sebuah task. Penentuan assignee dapat berdasarkan berbagai kondisi: dari field, dari group, dari parameter, atau di-split ke banyak orang.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "Tipe Assignment (`type`): `ALL` (default) — semua user bisa akses task; `DIRECT` — user tertentu saja; `MENTIONED` — user yang di-mention; `BY_PARAM` — berdasarkan parameter user management; `BY_FORM` — berdasarkan form tertentu." },
            { kind: "tip", text: "`Assignment.all()` membuat assignment dengan type `ALL`, artinya task dapat diakses oleh semua user." },
        ],
        fields: [
            f("type", "string", true, "Tipe assignment — menentukan cara penentuan assignee.", {
                enumValues: ["ALL", "DIRECT", "MENTIONED", "BY_PARAM", "BY_FORM"],
            }),
            f("refNode", "object", false, "Referensi node/form lain untuk menentukan assignee."),
            f("refField", "string", false, "Referensi field dalam task untuk mengambil data assignee."),
            f("refGroup", "string", false, "Referensi user group untuk assignment by group."),
            f("useByFromIfReject", "boolean", false, "Jika task di-reject, task kembali ke assignee asal (`true` = ya)."),
            f("params", "object", false, "Parameter untuk menentukan assignee (HashMap<String, Object>), digunakan saat type `BY_PARAM`."),
            f("ops", "object", false, "Operasi kriteria untuk filter/validasi assignment (HashMap<String, CriteriaOperation>)."),
            f("split", "boolean", false, "Flag apakah task akan di-split ke multiple assignee."),
        ],
        example: {
            type: "ALL",
            useByFromIfReject: false,
            split: false,
            "...": "...",
        },
        indexes: [],
        relations: [],
    },

    fields: {
        section: "Workflows",
        description: "Fields adalah bagian paling kompleks dari FORM — di sinilah isi sekaligus tampilan dari sebuah form didefinisikan.",
        long: "Fields merupakan turunan dari [[form|FORM]] dan menjadi bagian paling kompleks, karena di sinilah isi dari sebuah FORM didefinisikan beserta tampilannya. Sebuah field dapat berupa berbagai jenis input, seperti `text`, `number`, `dropdown`, `datetime`, dan lainnya. Setiap field memiliki `key` unik yang dapat dirujuk oleh konfigurasi lain (misalnya `preview.searches`). (Detail tiap jenis field akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("key", "string", true, "Key unik dari field di dalam form."),
            f("type", "string", true, "Jenis input field — menentukan tampilan field di form. Daftar di bawah belum lengkap.", {
                enumValues: ["text", "number", "dropdown", "datetime"],
            }),
        ],
        example: {
            key: "userInfo.name",
            type: "text",
            "...": "...",
        },
        indexes: [],
        relations: [],
    },

    queryfilters: {
        section: "Workflows",
        description: "QueryFilters digunakan untuk memfilter task yang ditampilkan pada sebuah FORM.",
        long: "QueryFilters merupakan turunan dari [[form|FORM]] yang dapat digunakan untuk hanya menampilkan task dengan status tertentu, priority tertentu, atau kondisi spesifik lainnya. QueryFilters terbagi menjadi tiga kelompok berdasarkan status task: `news`, `onProgress`, dan `historys`.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("news", "array", false, "Filter untuk task BARU (status: TODO). Isi tiap object dijelaskan pada [[validationcondition]].", { of: "object" }),
            f("onProgress", "array", false, "Filter untuk task SEDANG DIKERJAKAN (status: PENDING). Isi tiap object dijelaskan pada [[validationcondition]].", { of: "object" }),
            f("historys", "array", false, "Filter untuk task SELESAI (status: DONE). Isi tiap object dijelaskan pada [[validationcondition]].", { of: "object" }),
        ],
        example: {
            news: [{ "...": "..." }],
            onProgress: [{ "...": "..." }],
            historys: [{ "...": "..." }],
        },
        indexes: [],
        relations: [],
    },

    validationcondition: {
        section: "ETC",
        description: "ValidationCondition mendefinisikan satu kondisi filter/validasi yang dipakai pada QueryFilters maupun submitFilters.",
        long: "ValidationCondition merupakan bentuk object yang dipakai di dalam [[queryfilters]] (`news`, `onProgress`, `historys`) maupun pada `submitFilters` di [[form|FORM]], untuk menentukan satu kondisi filter atau validasi sebuah task.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("field", "string", true, "Field/kolom mana yang akan divalidasi (contoh: `$.status`, `$.priority`)."),
            f("op", "string", true, "Operator validasi (`==`, `!=`, `>`, `<`, `CONTAINS`, `IS_NULL`, dll)."),
            f("value", "string", false, "Nilai pembanding untuk validasi. Mengikuti `dataType`."),
            f("dataType", "string", false, "Tipe data field.", { enumValues: ["STRING", "DATE", "NUMBER", "FLOAT"] }),
            f("mdType", "string", false, "Validasi dengan data dari master data/report (tipe master data)."),
            f("mdKey", "string", false, "Validasi dengan data dari master data/report (key master data)."),
            f("errMessage", "string", false, "Pesan error jika validasi gagal."),
            f("btnFilter", "boolean", false, "Apakah ini filter untuk button/action."),
        ],
        example: {
            field: "$.amount",
            op: ">",
            value: "1000",
            dataType: "NUMBER",
            errMessage: "Amount harus lebih dari 1000",
            btnFilter: false,
        },
        indexes: [],
        relations: [],
    },

    validation: {
        section: "Workflows",
        description: "Validation adalah salah satu jenis Nodes pada Workflows yang berfungsi untuk memvalidasi data atau alur.",
        long: "Validation merupakan salah satu jenis Nodes pada Workflows, selain Tab atau FORM. (Konten dokumentasi Validation akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: true },
        notes: [],
        fields: [
            f("_id", "string", true, "Unique document identifier"),
        ],
        example: {
            _id: "exampleValidation",
        },
        indexes: [
            { name: "_id", keys: ["_id"], unique: true },
        ],
        relations: [
            { field: "nodes", to: "nodes", kind: "belongs to" },
        ],
    },

    routing: {
        section: "Workflows",
        description: "Routing menghubungkan satu Nodes dengan Nodes lainnya di dalam sebuah Workflows.",
        long: "Routing merupakan child dari Nodes yang berfungsi untuk menentukan alur perpindahan dari satu Nodes ke Nodes lainnya. (Konten dokumentasi Routing akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: true },
        notes: [],
        fields: [
            f("_id", "string", true, "Unique document identifier"),
        ],
        example: {
            _id: "exampleRouting",
        },
        indexes: [
            { name: "_id", keys: ["_id"], unique: true },
        ],
        relations: [
            { field: "nodes", to: "nodes", kind: "belongs to" },
        ],
    },

    workflow_runs: {
        section: "Workflows",
        description: "An execution record for a single run of a workflow.",
        long: "A run is created the moment a workflow fires and is updated as it progresses through its steps. It captures timing, the triggering source, runtime `context`, and structured `error` details if the run fails. This is the highest-volume collection in the system.",
        meta: { documents: "38.1k", indexed: true },
        notes: [
            { kind: "warn", text: "Runs are append-heavy. A 90-day TTL on `startedAt` archives old records — do not rely on them for long-term reporting." },
        ],
        fields: [
            f("_id", "objectid", true, "Unique document identifier"),
            f("workflowId", "objectid", true, "Reference to `workflows`"),
            f("status", "string", true, "Lifecycle of this run", { enumValues: ["queued", "running", "completed", "failed", "cancelled"] }),
            f("triggeredBy", "string", true, "Source that started the run", { enumValues: ["manual", "schedule", "webhook"] }),
            f("startedAt", "date", true, "When execution began"),
            f("completedAt", "date", false, "When execution finished"),
            f("currentStep", "number", false, "Index of the step in progress"),
            f("context", "object", false, "Runtime variables for this run"),
            f("error", "object", false, "Failure details, present when failed"),
            f("code", "string", false, "Machine-readable error code", { depth: 1 }),
            f("message", "string", false, "Human-readable error message", { depth: 1 }),
        ],
        example: {
            _id: "6651bc4dc3d4e5f678905555",
            workflowId: "6650a1f2c3d4e5f678901234",
            status: "completed",
            triggeredBy: "schedule",
            startedAt: "2025-06-10T09:00:00.000Z",
            completedAt: "2025-06-10T09:00:12.480Z",
            currentStep: 3,
            context: { signupId: "664f9c1a...ab", locale: "en-US" },
            error: null,
        },
        indexes: [
            { name: "workflowId_1_startedAt_-1", keys: ["workflowId", "startedAt"], unique: false },
            { name: "status_1", keys: ["status"], unique: false },
            { name: "startedAt_ttl", keys: ["startedAt"], unique: false, note: "TTL 90d" },
        ],
        relations: [
            { field: "workflowId", to: "workflows", kind: "belongs to" },
        ],
    },

    report_definitions: {
        section: "Reports",
        description: "Saved report specifications: a source, the columns to output, and default filters.",
        long: "A report definition describes how to turn a source collection into a tabular result. It lists the output `columns` with their labels and formatting, an optional default `filters` object, and a `visibility` level that governs who can run or see it. Schedules and results both point back to a definition.",
        meta: { documents: "312", indexed: true },
        notes: [
            { kind: "note", text: "`columns[].field` uses dot notation to reach nested values in the source documents." },
            { kind: "tip", text: "`visibility` controls discovery and execution. A `private` report is only visible to its `ownerId`." },
        ],
        fields: [
            f("_id", "objectid", true, "Unique document identifier"),
            f("name", "string", true, "Report title"),
            f("description", "string", false, "Purpose of the report"),
            f("source", "string", true, "Source collection or view name"),
            f("columns", "array", true, "Output column definitions", { of: "object" }),
            f("field", "string", true, "Field path in the source document", { depth: 1 }),
            f("label", "string", true, "Column display label", { depth: 1 }),
            f("format", "string", false, "Cell formatting", { depth: 1, enumValues: ["text", "number", "currency", "date", "percent"] }),
            f("filters", "object", false, "Default filter criteria"),
            f("visibility", "string", true, "Who can view the report", { enumValues: ["private", "team", "public"] }),
            f("ownerId", "objectid", true, "Reference to `users`"),
            f("createdAt", "date", true, "Creation timestamp"),
            f("updatedAt", "date", true, "Last update timestamp"),
        ],
        example: {
            _id: "6648f0a2c3d4e5f678902100",
            name: "Monthly Active Workflows",
            description: "Active workflows grouped by owner for the current month",
            source: "workflows",
            columns: [
                { field: "name", label: "Workflow", format: "text" },
                { field: "status", label: "State", format: "text" },
                { field: "createdAt", label: "Created", format: "date" },
            ],
            filters: { status: "active" },
            visibility: "team",
            ownerId: "664f9c1a...ab",
            createdAt: "2025-04-02T11:20:00.000Z",
            updatedAt: "2025-06-01T08:05:00.000Z",
        },
        indexes: [
            { name: "name_1", keys: ["name"], unique: false },
            { name: "ownerId_1", keys: ["ownerId"], unique: false },
            { name: "visibility_1", keys: ["visibility"], unique: false },
        ],
        relations: [
            { field: "ownerId", to: "users", kind: "references" },
            { field: "_id", to: "report_schedules", kind: "referenced by" },
        ],
    },

    report_schedules: {
        section: "Reports",
        description: "Recurring delivery rules that run a report on a cron schedule and email the output.",
        long: "A schedule binds a report definition to a cron expression, a timezone, a set of recipients, and a delivery file format. The scheduler reads `enabled` and `nextRunAt` to decide what to dispatch.",
        meta: { documents: "96", indexed: true },
        notes: [
            { kind: "note", text: "`timezone` is an IANA name such as `Asia/Jakarta`. The cron is evaluated in that zone." },
        ],
        fields: [
            f("_id", "objectid", true, "Unique document identifier"),
            f("reportId", "objectid", true, "Reference to `report_definitions`"),
            f("cron", "string", true, "Cron schedule expression"),
            f("timezone", "string", true, "IANA timezone name"),
            f("recipients", "array", true, "Recipient email addresses", { of: "string" }),
            f("format", "string", true, "Delivery file format", { enumValues: ["pdf", "csv", "xlsx"] }),
            f("enabled", "boolean", true, "Whether the schedule is active"),
            f("lastRunAt", "date", false, "Previous dispatch timestamp"),
            f("nextRunAt", "date", false, "Next scheduled dispatch"),
            f("createdAt", "date", true, "Creation timestamp"),
        ],
        example: {
            _id: "6649aa31c3d4e5f678903300",
            reportId: "6648f0a2c3d4e5f678902100",
            cron: "0 7 1 * *",
            timezone: "Asia/Jakarta",
            recipients: ["ops@acme.co", "lead@acme.co"],
            format: "pdf",
            enabled: true,
            lastRunAt: "2025-06-01T00:00:00.000Z",
            nextRunAt: "2025-07-01T00:00:00.000Z",
            createdAt: "2025-04-02T11:25:00.000Z",
        },
        indexes: [
            { name: "reportId_1", keys: ["reportId"], unique: false },
            { name: "nextRunAt_1", keys: ["nextRunAt"], unique: false },
            { name: "enabled_1_nextRunAt_1", keys: ["enabled", "nextRunAt"], unique: false },
        ],
        relations: [
            { field: "reportId", to: "report_definitions", kind: "belongs to" },
        ],
    },

    report_results: {
        section: "Reports",
        description: "The output of a single report run, including row count and generated file.",
        long: "A result is written every time a report is generated, whether on demand or by a schedule. It records the status, how many rows were produced, the generation time, and a link to the rendered file.",
        meta: { documents: "12.4k", indexed: true },
        notes: [
            { kind: "note", text: "`scheduleId` is null for ad-hoc runs triggered manually from the UI." },
        ],
        fields: [
            f("_id", "objectid", true, "Unique document identifier"),
            f("reportId", "objectid", true, "Reference to `report_definitions`"),
            f("scheduleId", "objectid", false, "Schedule that produced this, if any"),
            f("status", "string", true, "Outcome of the run", { enumValues: ["success", "partial", "failed"] }),
            f("rowCount", "number", true, "Number of rows generated"),
            f("fileUrl", "string", false, "Location of the generated file"),
            f("durationMs", "number", true, "Generation time in milliseconds"),
            f("generatedAt", "date", true, "When the run completed"),
            f("generatedBy", "objectid", false, "User who triggered an ad-hoc run"),
        ],
        example: {
            _id: "664b12c8c3d4e5f678904400",
            reportId: "6648f0a2c3d4e5f678902100",
            scheduleId: "6649aa31c3d4e5f678903300",
            status: "success",
            rowCount: 482,
            fileUrl: "s3://reports/2025-06/mawf-482.pdf",
            durationMs: 1842,
            generatedAt: "2025-06-01T00:00:01.842Z",
            generatedBy: null,
        },
        indexes: [
            { name: "reportId_1_generatedAt_-1", keys: ["reportId", "generatedAt"], unique: false },
            { name: "status_1", keys: ["status"], unique: false },
        ],
        relations: [
            { field: "reportId", to: "report_definitions", kind: "belongs to" },
            { field: "scheduleId", to: "report_schedules", kind: "references" },
        ],
    },

    users: {
        section: "Masterdata",
        description: "People with access to the system, their role, and profile information.",
        long: "A user is the actor behind almost every write in the system. Identity is the unique `email`; access is governed by `role`, and `status` reflects the account lifecycle from invite to suspension. The nested `profile` object holds optional display details.",
        meta: { documents: "8.7k", indexed: true },
        notes: [
            { kind: "tip", text: "`role` is coarse-grained access control. Pair it with report `visibility` for fine-grained read rules." },
            { kind: "warn", text: "Never store credentials here. Passwords live in the auth service, not in `users`." },
        ],
        fields: [
            f("_id", "objectid", true, "Unique document identifier"),
            f("email", "string", true, "Login email, unique across the collection"),
            f("name", "string", true, "Full display name"),
            f("role", "string", true, "Access level", { enumValues: ["admin", "editor", "viewer"] }),
            f("status", "string", true, "Account lifecycle state", { enumValues: ["active", "invited", "suspended"] }),
            f("profile", "object", false, "Extended profile information"),
            f("avatarUrl", "string", false, "Profile image URL", { depth: 1 }),
            f("phone", "string", false, "Contact number", { depth: 1 }),
            f("timezone", "string", false, "Preferred IANA timezone", { depth: 1 }),
            f("companyId", "objectid", false, "Reference to `companies`"),
            f("lastLoginAt", "date", false, "Most recent sign-in"),
            f("createdAt", "date", true, "Creation timestamp"),
            f("updatedAt", "date", true, "Last update timestamp"),
        ],
        example: {
            _id: "664f9c1ac3d4e5f6789012ab",
            email: "ada@acme.co",
            name: "Ada Lovelace",
            role: "admin",
            status: "active",
            profile: {
                avatarUrl: "https://cdn.acme.co/u/ada.png",
                phone: "+62 812-0000-0000",
                timezone: "Asia/Jakarta",
            },
            companyId: "664e7711...c0",
            lastLoginAt: "2025-06-18T02:14:00.000Z",
            createdAt: "2024-11-02T09:00:00.000Z",
            updatedAt: "2025-06-18T02:14:00.000Z",
        },
        indexes: [
            { name: "email_1", keys: ["email"], unique: true },
            { name: "companyId_1", keys: ["companyId"], unique: false },
            { name: "role_1_status_1", keys: ["role", "status"], unique: false },
        ],
        relations: [
            { field: "companyId", to: "companies", kind: "belongs to" },
            { field: "_id", to: "workflows", kind: "referenced by (createdBy)" },
        ],
    },

    companies: {
        section: "Masterdata",
        description: "Tenant organizations that own users, billing, and subscription plan.",
        long: "A company is the billing and tenancy boundary. It tracks the subscription `plan`, licensed `seats`, and an optional `address`. Users reference their company through `companyId`.",
        meta: { documents: "1.4k", indexed: true },
        notes: [
            { kind: "note", text: "`slug` is the URL-safe identifier used in tenant subdomains and must be unique." },
        ],
        fields: [
            f("_id", "objectid", true, "Unique document identifier"),
            f("name", "string", true, "Company legal name"),
            f("slug", "string", true, "URL-safe unique identifier"),
            f("industry", "string", false, "Primary industry"),
            f("plan", "string", true, "Subscription tier", { enumValues: ["free", "pro", "enterprise"] }),
            f("seats", "number", true, "Number of licensed seats"),
            f("billingEmail", "string", false, "Invoice recipient"),
            f("address", "object", false, "Postal address"),
            f("city", "string", false, "City", { depth: 1 }),
            f("country", "string", false, "ISO country code", { depth: 1 }),
            f("createdAt", "date", true, "Creation timestamp"),
        ],
        example: {
            _id: "664e7711c3d4e5f6789011c0",
            name: "Acme Corporation",
            slug: "acme",
            industry: "Software",
            plan: "enterprise",
            seats: 120,
            billingEmail: "billing@acme.co",
            address: { city: "Jakarta", country: "ID" },
            createdAt: "2024-09-15T10:00:00.000Z",
        },
        indexes: [
            { name: "slug_1", keys: ["slug"], unique: true },
            { name: "plan_1", keys: ["plan"], unique: false },
        ],
        relations: [
            { field: "_id", to: "users", kind: "referenced by" },
        ],
    },

    products: {
        section: "Masterdata",
        description: "Catalog items with pricing, stock status, and flexible attributes.",
        long: "A product belongs to one category and carries pricing in minor currency units. The `attributes` object is schemaless to support varied product types, while `tags` power faceted search.",
        meta: { documents: "22.3k", indexed: true },
        notes: [
            { kind: "warn", text: "`price` is stored in minor units (cents / sen). Divide by 100 before display." },
        ],
        fields: [
            f("_id", "objectid", true, "Unique document identifier"),
            f("sku", "string", true, "Stock keeping unit, unique"),
            f("name", "string", true, "Product display name"),
            f("categoryId", "objectid", true, "Reference to `categories`"),
            f("price", "number", true, "Unit price in minor units"),
            f("currency", "string", true, "Price currency", { enumValues: ["USD", "IDR", "EUR"] }),
            f("inStock", "boolean", true, "Availability flag"),
            f("attributes", "object", false, "Flexible product attributes"),
            f("tags", "array", false, "Search tags", { of: "string" }),
            f("createdAt", "date", true, "Creation timestamp"),
        ],
        example: {
            _id: "6650cd90c3d4e5f678906600",
            sku: "ACM-TSHIRT-BLK-M",
            name: "Acme Logo Tee — Black / M",
            categoryId: "664fee21...09",
            price: 199000,
            currency: "IDR",
            inStock: true,
            attributes: { color: "black", size: "M", material: "cotton" },
            tags: ["apparel", "tee", "black"],
            createdAt: "2025-05-30T07:45:00.000Z",
        },
        indexes: [
            { name: "sku_1", keys: ["sku"], unique: true },
            { name: "categoryId_1", keys: ["categoryId"], unique: false },
            { name: "tags_1", keys: ["tags"], unique: false, note: "multikey" },
        ],
        relations: [
            { field: "categoryId", to: "categories", kind: "belongs to" },
        ],
    },

    categories: {
        section: "Masterdata",
        description: "A self-referencing tree that organizes products into a hierarchy.",
        long: "Categories form a tree through `parentId`, which is null at the root. `order` controls sibling sorting and `active` hides a branch without deleting it.",
        meta: { documents: "184", indexed: true },
        notes: [
            { kind: "note", text: "A root category has `parentId` of null. There is no depth limit enforced at the schema level." },
        ],
        fields: [
            f("_id", "objectid", true, "Unique document identifier"),
            f("name", "string", true, "Category name"),
            f("slug", "string", true, "URL-safe identifier"),
            f("parentId", "objectid", false, "Parent category, null at root"),
            f("order", "number", false, "Sort order among siblings"),
            f("active", "boolean", true, "Whether the category is shown"),
            f("createdAt", "date", true, "Creation timestamp"),
        ],
        example: {
            _id: "664fee21c3d4e5f678900009",
            name: "Apparel",
            slug: "apparel",
            parentId: null,
            order: 1,
            active: true,
            createdAt: "2025-01-12T12:00:00.000Z",
        },
        indexes: [
            { name: "slug_1", keys: ["slug"], unique: true },
            { name: "parentId_1_order_1", keys: ["parentId", "order"], unique: false },
        ],
        relations: [
            { field: "parentId", to: "categories", kind: "references (self)" },
            { field: "_id", to: "products", kind: "referenced by" },
        ],
    },
}

const ALL_IDS = SECTIONS.flatMap((s) => s.collections)

/** Collections that are a sub-collection of another — rendered indented in the sidebar. */
const CHILD_OF: Record<string, string> = { nodes: "workflows", form: "nodes", validation: "nodes", routing: "nodes", assignment: "form", fields: "form", queryfilters: "form" }

/** How deep a collection sits in the parent chain — drives sidebar indentation. */
function depthOf(id: string): number {
    let d = 0
    let cur: string | undefined = id
    while (cur && CHILD_OF[cur]) { d++; cur = CHILD_OF[cur] }
    return d
}
const ANCHORS = [
    { id: "overview", label: "Overview" },
    { id: "schema", label: "Schema" },
    { id: "example", label: "Example document" },
    { id: "indexes", label: "Indexes & relations" },
]

/* ---------------- small components ---------------- */
function TypeCell({ field }: { field: Field }) {
    return (
        <div className="type-cell">
            <span className={`tb tb-${field.kind}`}><span className="dot" />{field.kind}</span>
            {field.of && <span className="type-of">{`<${field.of}>`}</span>}
            {field.enumValues && (
                <>
                    <span className="enum-label">enum</span>
                    {field.enumValues.map((v) => <span key={v} className="enum-chip">{v}</span>)}
                </>
            )}
        </div>
    )
}

function ReqCell({ required }: { required: boolean }) {
    return (
        <span className={`req ${required ? "required" : "optional"}`}>
            <span className="rdot" />{required ? "required" : "optional"}
        </span>
    )
}

function SchemaTable({ fields, onNavigate }: { fields: Field[]; onNavigate?: (id: string) => void }) {
    return (
        <div className="table-scroll">
            <div className="table-x">
                <table className="schema-table">
                    <colgroup>
                        <col style={{ width: "27%" }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "33%" }} />
                    </colgroup>
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        {fields.map((field, i) => {
                            const depth = field.depth || 0
                            return (
                                <tr key={i}>
                                    <td>
                                        <div className="field-cell" style={{ paddingLeft: depth ? depth * 18 : 0 }}>
                                            {depth > 0 && <span className="tree-guide" aria-hidden="true" />}
                                            <span className={`field-name${depth ? " nested" : ""}`}>{field.name}</span>
                                        </div>
                                    </td>
                                    <td><TypeCell field={field} /></td>
                                    <td><ReqCell required={field.required} /></td>
                                    <td><div className="desc-cell">{renderText(field.description, onNavigate)}</div></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function CodeBlock({ fname, data, copied, onCopy }: {
    fname: string
    data: unknown
    copied: boolean
    onCopy: (text: string) => void
}) {
    const json = useMemo(() => JSON.stringify(data, null, 2), [data])
    return (
        <div className="code-block">
            <div className="code-head">
                <span className="code-fname">
                    <span className="dots"><i style={{ background: "#ff5f57" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#28c840" }} /></span>
                    <FileJson size={14} /> {fname}
                </span>
                <button className={`copy-btn${copied ? " copied" : ""}`} onClick={() => onCopy(json)}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <div className="code-body">
                <pre><code>{highlightJson(json)}</code></pre>
            </div>
        </div>
    )
}

/** Custom (non-collection) page: trigger a server .jar restart. */
function RestartJarPanel() {
    const [status, setStatus] = useState<"idle" | "running" | "done">("idle")
    const trigger = () => {
        if (status === "running") return
        setStatus("running")
        setTimeout(() => setStatus("done"), 1500)
    }
    return (
        <>
            <div className="crumbs">
                <span>ETC</span>
                <ChevronRight className="c-sep" size={14} />
                <span className="c-cur">restart_jar</span>
            </div>
            <h1 className="page-title">restart_jar</h1>
            <p className="page-desc">Restart service .jar di server agar perubahan pada routing maupun assignment terbaca oleh project Spring Boot.</p>
            <hr className="divider" />
            <section className="doc-section">
                <h2 className="sec-h">Restart Jar</h2>
                <p className="prose">{renderText("Setiap perubahan pada `routing` atau `assignment` membutuhkan Restart Jar di server. Klik tombol di bawah untuk menjalankan Restart Jar.")}</p>
                <button className="restart-btn" onClick={trigger} disabled={status === "running"}>
                    <RotateCw size={16} className={status === "running" ? "spin" : undefined} />
                    {status === "running" ? "Memproses…" : status === "done" ? "Permintaan terkirim" : "Restart Jar"}
                </button>
                {status === "done" && (
                    <p className="prose" style={{ marginTop: 12 }}>Permintaan Restart Jar telah dikirim ke server.</p>
                )}
            </section>
        </>
    )
}

/* ---------------- main ---------------- */
export default function MongoDocs({ onClose }: { onClose?: () => void }) {
    const [theme, setTheme] = useState<"light" | "dark">("light")
    const [activeId, setActiveId] = useState("workflows")
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ Workflows: true, Reports: true, Masterdata: true, ETC: true })
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [copied, setCopied] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [activeSection, setActiveSection] = useState("overview")
    const [versionOpen, setVersionOpen] = useState(false)
    const [version, setVersion] = useState("v1.0")

    const mainRef = useRef<HTMLElement | null>(null)
    const searchRef = useRef<HTMLInputElement | null>(null)
    const searchWrapRef = useRef<HTMLDivElement | null>(null)
    const versionWrapRef = useRef<HTMLDivElement | null>(null)
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
    const ticking = useRef(false)
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const current = COLLECTIONS[activeId]

    /* footer pager — previous / next collection in sidebar order */
    const pageIdx = ALL_IDS.indexOf(activeId)
    const prevId = pageIdx > 0 ? ALL_IDS[pageIdx - 1] : null
    const nextId = pageIdx >= 0 && pageIdx < ALL_IDS.length - 1 ? ALL_IDS[pageIdx + 1] : null

    /* search index (collections + fields with dotted paths) */
    const searchIndex = useMemo<SearchItem[]>(() => {
        const items: SearchItem[] = []
        for (const id of ALL_IDS) {
            const c = COLLECTIONS[id]
            if (!c) continue
            items.push({ type: "collection", id, title: id, sub: c.description, section: c.section })
            const stack: string[] = []
            for (const fld of c.fields) {
                const d = fld.depth || 0
                stack[d] = fld.name; stack.length = d + 1
                const path = stack.join(".")
                items.push({ type: "field", id, title: path, sub: `${id} · ${fld.description}`, kind: fld.kind })
            }
        }
        return items
    }, [])

    const q = query.trim().toLowerCase()
    const results = q
        ? searchIndex.filter((it) => it.title.toLowerCase().includes(q) || (it.sub || "").toLowerCase().includes(q)).slice(0, 28)
        : null

    /* reset on collection change */
    useEffect(() => {
        if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "auto" })
        setActiveSection("overview")
        setDrawerOpen(false)
    }, [activeId])

    /* cmd/ctrl + k, escape */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setSearchOpen(true)
                if (searchRef.current) searchRef.current.focus()
            }
            if (e.key === "Escape") {
                if (searchOpen || versionOpen) {
                    setSearchOpen(false)
                    setVersionOpen(false)
                    if (searchRef.current) searchRef.current.blur()
                } else {
                    onClose?.()
                }
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [searchOpen, versionOpen, onClose])

    /* outside-click for popovers */
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node
            if (searchWrapRef.current && !searchWrapRef.current.contains(target)) setSearchOpen(false)
            if (versionWrapRef.current && !versionWrapRef.current.contains(target)) setVersionOpen(false)
        }
        document.addEventListener("mousedown", onDoc)
        return () => document.removeEventListener("mousedown", onDoc)
    }, [])

    /* scroll spy */
    const handleScroll = () => {
        if (ticking.current) return
        ticking.current = true
        requestAnimationFrame(() => {
            const main = mainRef.current
            if (main) {
                const mt = main.getBoundingClientRect().top
                let cur = ANCHORS[0].id
                for (const a of ANCHORS) {
                    const el = sectionRefs.current[a.id]
                    if (el && el.getBoundingClientRect().top - mt <= 28) cur = a.id
                }
                setActiveSection(cur)
            }
            ticking.current = false
        })
    }

    const scrollToSection = (id: string) => {
        const main = mainRef.current
        const el = sectionRefs.current[id]
        if (!main || !el) return
        const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 12
        main.scrollTo({ top, behavior: "smooth" })
    }

    const handleCopy = async (text: string) => {
        const ok = await copyText(text)
        if (ok) {
            setCopied(true)
            if (copyTimer.current) clearTimeout(copyTimer.current)
            copyTimer.current = setTimeout(() => setCopied(false), 1800)
        }
    }

    const goTo = (id: string, anchor?: string | null) => {
        setActiveId(id)
        setSearchOpen(false)
        setQuery("")
        if (anchor) setTimeout(() => scrollToSection(anchor), 90)
    }

    const toggleSection = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

    return (
        <div className={`mongodocs${theme === "dark" ? " dark" : ""}`}>
            <style>{STYLES}</style>

            {/* ---------- top bar ---------- */}
            <header className="topbar">
                <button className="hamburger" onClick={() => setDrawerOpen((v) => !v)} aria-label="Toggle navigation">
                    {drawerOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                <div className="brand">
                    <span className="brand-mark"><Braces size={16} strokeWidth={2.4} /></span>
                    <span className="brand-name">Montra<span>Docs</span></span>
                </div>

                <div className="search-wrap" ref={searchWrapRef}>
                    <Search className="search-icon" size={16} />
                    <input
                        ref={searchRef}
                        className="search-input"
                        placeholder="Search collections and fields…"
                        value={query}
                        onFocus={() => setSearchOpen(true)}
                        onChange={(e) => { setQuery(e.target.value); setSearchOpen(true) }}
                    />
                    {!searchOpen && (
                        <span className="kbd-hint"><span className="kbd">⌘</span><span className="kbd">K</span></span>
                    )}

                    {searchOpen && (
                        <div className="search-panel">
                            {results === null && (
                                <>
                                    {SECTIONS.map((sec) => (
                                        <div key={sec.id}>
                                            <div className="search-grouplabel">{sec.label}</div>
                                            {sec.collections.map((id) => (
                                                <div key={id} className="result" onClick={() => goTo(id)}>
                                                    <span className="result-ico coll"><Database size={14} /></span>
                                                    <div className="result-body">
                                                        <div className="result-title">{id}</div>
                                                        <div className="result-sub">{COLLECTIONS[id].description}</div>
                                                    </div>
                                                    <span className="result-kind">collection</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </>
                            )}

                            {results !== null && results.length > 0 && results.map((it, i) => (
                                <div key={i} className="result" onClick={() => goTo(it.id, it.type === "field" ? "schema" : null)}>
                                    <span className={`result-ico${it.type === "collection" ? " coll" : ""}`}>
                                        {it.type === "collection" ? <Database size={14} /> : <Braces size={13} />}
                                    </span>
                                    <div className="result-body">
                                        <div className="result-title">{it.title}</div>
                                        <div className="result-sub">{it.sub}</div>
                                    </div>
                                    <span className="result-kind">{it.type === "collection" ? "collection" : it.kind}</span>
                                </div>
                            ))}

                            {results !== null && results.length === 0 && (
                                <div className="search-empty">No matches for “{query}”. Try a collection or field name.</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="topbar-right">
                    <div className="version-wrap" ref={versionWrapRef}>
                        <button className="version-btn" onClick={() => setVersionOpen((v) => !v)}>
                            <span className="vlabel">{version}</span><ChevronsUpDown size={14} />
                        </button>
                        {versionOpen && (
                            <div className="version-menu">
                                {[{ v: "v1.0", t: "latest" }, { v: "v0.9", t: "" }, { v: "v0.8", t: "" }].map(({ v, t }) => (
                                    <button key={v} className={`version-item${v === version ? " sel" : ""}`} onClick={() => { setVersion(v); setVersionOpen(false) }}>
                                        <span>{v}</span>{t && <span className="version-tag">{t}</span>}
                                        {v === version && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="icon-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} aria-label="Toggle theme">
                        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                    </button>

                    {onClose && (
                        <button className="icon-btn" onClick={onClose} aria-label="Close documentation">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </header>

            {/* ---------- layout ---------- */}
            <div className="layout">
                {drawerOpen && <div className="overlay" onClick={() => setDrawerOpen(false)} />}

                {/* sidebar */}
                <nav className={`sidebar${drawerOpen ? " open" : ""}`}>
                    {SECTIONS.map((sec) => {
                        const Icon = sec.icon
                        const open = expanded[sec.id]
                        return (
                            <div className="nav-group" key={sec.id}>
                                <button className="nav-group-header" onClick={() => toggleSection(sec.id)}>
                                    <ChevronDown className="chev" size={14} style={{ transform: open ? "none" : "rotate(-90deg)" }} />
                                    <Icon size={15} />
                                    <span className="seclabel">{sec.label}</span>
                                    <span className="nav-count">{sec.collections.length}</span>
                                </button>
                                {open && (
                                    <div className="nav-children">
                                        {sec.collections.map((id) => (
                                            <button
                                                key={id}
                                                className={`nav-item${id === activeId ? " active" : ""}${CHILD_OF[id] ? " child" : ""}`}
                                                style={CHILD_OF[id] ? ({ "--ind": depthOf(id) } as React.CSSProperties) : undefined}
                                                onClick={() => setActiveId(id)}
                                            >
                                                {id}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* main */}
                <main className="main" ref={mainRef} onScroll={handleScroll}>
                    <div className="main-inner">
                        {current ? (
                        <>
                        <div className="crumbs">
                            <span>{current.section}</span>
                            <ChevronRight className="c-sep" size={14} />
                            <span className="c-cur">{activeId}</span>
                        </div>

                        <h1 className="page-title">{activeId}</h1>
                        <p className="page-desc">{current.description}</p>
                        <div className="chips">
                            <span className="chip"><Database size={13} />{current.meta.documents} documents</span>
                            {current.meta.indexed && <span className="chip"><KeyRound size={13} />indexed</span>}
                            <span className="chip accent">{current.section}</span>
                        </div>

                        <hr className="divider" />

                        {/* overview */}
                        <section className="doc-section" ref={(el) => { sectionRefs.current.overview = el }}>
                            <h2 className="sec-h">Overview <Link2 className="anchor" size={15} /></h2>
                            <p className="prose">{renderText(current.long, goTo)}</p>
                            {current.notes.map((n, i) => (
                                <div key={i} className={`callout ${n.kind}`}>
                                    <span className="ci">
                                        {n.kind === "tip" ? <Check size={16} /> : n.kind === "warn" ? <KeyRound size={16} /> : <ChevronRight size={16} />}
                                    </span>
                                    <div>{renderText(n.text, goTo)}</div>
                                </div>
                            ))}
                        </section>

                        {/* schema */}
                        <section className="doc-section" ref={(el) => { sectionRefs.current.schema = el }}>
                            <h2 className="sec-h">Schema <Link2 className="anchor" size={15} /></h2>
                            {current.fields.length > 0 ? (
                                <>
                                    <p className="prose">Definisi tiap field pada dokumen <code className="icode">{activeId}</code>. Objek bersarang (nested) dan bentuk elemen array ditampilkan menjorok ke dalam di bawah induknya.</p>
                                    <SchemaTable fields={current.fields} onNavigate={goTo} />
                                </>
                            ) : activeId === "nodes" ? (
                                <p className="prose">{renderText("Schema untuk setiap Nodes akan dijelaskan secara detail pada [[form|FORM]] dan [[validation|Validation]].", goTo)}</p>
                            ) : (
                                <p className="prose">Schema untuk <code className="icode">{activeId}</code> akan dilengkapi kemudian.</p>
                            )}
                        </section>

                        {/* example */}
                        <section className="doc-section" ref={(el) => { sectionRefs.current.example = el }}>
                            <h2 className="sec-h">Example document <Link2 className="anchor" size={15} /></h2>
                            <p className="prose">A representative document as stored in the <code className="icode">{activeId}</code> collection.</p>
                            <CodeBlock fname={`${activeId}.example.json`} data={current.example} copied={copied} onCopy={handleCopy} />
                        </section>

                        {/* indexes & relations */}
                        <section className="doc-section" ref={(el) => { sectionRefs.current.indexes = el }}>
                            <h2 className="sec-h">Indexes &amp; relations <Link2 className="anchor" size={15} /></h2>
                            <div className="kv-grid">
                                {current.indexes.length > 0 && (
                                <div>
                                    <div className="kv-block-label"><KeyRound size={13} /> Indexes</div>
                                    {current.indexes.map((idx, i) => (
                                        <div className="idx-row" key={i}>
                                            <span className="idx-name">{idx.name}</span>
                                            <span className="idx-keys">
                                                {idx.keys.map((k) => <span key={k} className="enum-chip">{k}</span>)}
                                            </span>
                                            {idx.note && <span className="idx-badge plain">{idx.note}</span>}
                                            <span className={`idx-badge ${idx.unique ? "unique" : "plain"}`}>{idx.unique ? "unique" : "non-unique"}</span>
                                        </div>
                                    ))}
                                </div>
                                )}
                                <div>
                                    <div className="kv-block-label"><Link2 size={13} /> Relations</div>
                                    {current.relations.length > 0 ? current.relations.map((rel, i) => (
                                        <div className="rel-row" key={i}>
                                            <span className="rel-field">{rel.field}</span>
                                            <ArrowRight className="rel-arrow" size={15} />
                                            <span className="rel-target" onClick={() => goTo(rel.to)}>{rel.to}</span>
                                            <span className="rel-kind">{rel.kind}</span>
                                        </div>
                                    )) : (
                                        <p className="kv-empty">Belum ada relations di sini.</p>
                                    )}
                                </div>
                            </div>
                        </section>
                        </>
                        ) : CUSTOM_PAGES.has(activeId) ? (
                            <RestartJarPanel />
                        ) : null}

                        {/* footer pager */}
                        {(prevId || nextId) && (
                            <nav className="pager">
                                {prevId && (
                                    <button className="pager-btn prev" onClick={() => goTo(prevId)}>
                                        <ArrowLeft className="pager-ico" size={15} />
                                        <span className="pager-label">Sebelumnya</span>
                                        <span className="pager-title">{prevId}</span>
                                    </button>
                                )}
                                {nextId && (
                                    <button className="pager-btn next" onClick={() => goTo(nextId)}>
                                        <span className="pager-label">Selanjutnya</span>
                                        <span className="pager-title">{nextId}</span>
                                        <ArrowRight className="pager-ico" size={15} />
                                    </button>
                                )}
                            </nav>
                        )}
                    </div>
                </main>

                {/* right rail */}
                {current && (
                    <aside className="rightrail">
                        <div className="rail-sticky">
                            <p className="rail-title">On this page</p>
                            {ANCHORS.map((a) => (
                                <button
                                    key={a.id}
                                    className={`rail-link${activeSection === a.id ? " active" : ""}`}
                                    onClick={() => scrollToSection(a.id)}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    )
}
