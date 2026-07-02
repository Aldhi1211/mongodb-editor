"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import s from "./filterBuilder.module.css";

/* ============================== types ============================== */
export type FieldDef = { name: string; type: string };
type Cond = { type: "cond"; field: string; operator: string; value: any; ci: boolean };
type Group = { type: "group"; logic: "AND" | "OR"; children: (Cond | Group)[] };
type ParsedQuery =
  | { operation: "find"; filter: any; sort?: any }
  | { operation: "deleteOne" | "deleteMany" | "updateOne" | "updateMany"; filter: any; update?: any };

interface Props {
  open: boolean;
  collection: string;
  fields: FieldDef[];
  count: number;
  canDelete: boolean;
  parseQuery: (raw: string) => ParsedQuery;
  onRunFind: (filter: any, sort?: any) => void;
  onRequestWrite: (op: ParsedQuery) => void;
  onClose: () => void;
}

/* ============================== constants ============================== */
const OPERATORS = [
  { op: "$eq", label: "equals" },
  { op: "$ne", label: "not equals" },
  { op: "$gt", label: "greater than" },
  { op: "$gte", label: "greater or equal" },
  { op: "$lt", label: "less than" },
  { op: "$lte", label: "less or equal" },
  { op: "$in", label: "in" },
  { op: "$nin", label: "not in" },
  { op: "$regex", label: "contains" },
  { op: "$exists", label: "exists" },
  { op: "$type", label: "type" },
  { op: "$null", label: "is null" },
  { op: "$notnull", label: "is not null" },
];
const opMap = Object.fromEntries(OPERATORS.map((o) => [o.op, o]));
const BSON_TYPES = ["string", "number", "int", "long", "double", "bool", "date", "array", "object", "objectId", "null"];

/* ============================== icons ============================== */
const Caret = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="m4 6 4 4 4-4" /></svg>);
const X = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="m4 4 8 8M12 4l-8 8" /></svg>);
const Plus = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="M8 3.2v9.6M3.2 8h9.6" /></svg>);
const Check = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="m3.5 8.5 3 3 6-7" /></svg>);
const GroupGlyph = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3 2.5v11M3 4.5h3.5M3 8h2.5M3 11.5h3.5" /></svg>);
const Collection = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4}><ellipse cx="8" cy="3.5" rx="5.5" ry="2.2" /><path d="M2.5 3.5v9c0 1.2 2.46 2.2 5.5 2.2s5.5-1 5.5-2.2v-9" /><path d="M2.5 8c0 1.2 2.46 2.2 5.5 2.2S13.5 9.2 13.5 8" /></svg>);

/* ============================== helpers ============================== */
function escapeHtml(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toJSON(v: any, pretty: boolean, level = 0): string {
  const padIn = pretty ? "  ".repeat(level + 1) : "";
  const pad = pretty ? "  ".repeat(level) : "";
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (pretty) return "[\n" + v.map((x) => padIn + toJSON(x, true, level + 1)).join(",\n") + "\n" + pad + "]";
    return "[" + v.map((x) => toJSON(x, false, level + 1)).join(", ") + "]";
  }
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length === 0) return "{}";
    if (pretty) return "{\n" + keys.map((k) => padIn + '"' + k + '": ' + toJSON(v[k], true, level + 1)).join(",\n") + "\n" + pad + "}";
    return "{ " + keys.map((k) => '"' + k + '": ' + toJSON(v[k], false, level + 1)).join(", ") + " }";
  }
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}

function highlightJSON(text: string): string {
  let out = "", i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1, str = '"';
      while (j < n) {
        if (text[j] === "\\" && j + 1 < n) { str += text[j] + text[j + 1]; j += 2; continue; }
        str += text[j];
        if (text[j] === '"') { j++; break; }
        j++;
      }
      let k = j; while (k < n && /\s/.test(text[k])) k++;
      const isKey = text[k] === ":";
      const isOp = /^"\$/.test(str);
      const cls = isOp ? s.tokOp : isKey ? s.tokKey : s.tokStr;
      out += '<span class="' + cls + '">' + escapeHtml(str) + "</span>";
      i = j;
    } else if (/[0-9]/.test(c) || (c === "-" && /[0-9]/.test(text[i + 1] || ""))) {
      let j = i, num = "";
      while (j < n && /[0-9.eE+\-]/.test(text[j])) { num += text[j]; j++; }
      out += '<span class="' + s.tokNum + '">' + escapeHtml(num) + "</span>";
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i, w = "";
      while (j < n && /[a-zA-Z_$.]/.test(text[j])) { w += text[j]; j++; }
      out += '<span class="' + (/^(true|false|null)$/.test(w) ? s.tokNum : s.tokStr) + '">' + escapeHtml(w) + "</span>";
      i = j;
    } else if ("{}[](),:".indexOf(c) !== -1) {
      out += '<span class="' + s.tokPunc + '">' + escapeHtml(c) + "</span>";
      i++;
    } else {
      out += escapeHtml(c);
      i++;
    }
  }
  return out;
}

/* ============================== query build ============================== */
const OBJECTID_RE = /^[0-9a-fA-F]{24}$/;

function coerce(type: string, raw: any) {
  if (type === "number") { const num = Number(raw); return raw !== "" && !isNaN(num) ? num : raw; }
  if (type === "boolean") return raw === true || raw === "true";
  return raw;
}
function oidWrap(field: string, raw: any) {
  // For _id fields, turn a 24-hex string into an ObjectId via extended JSON.
  if (field === "_id" && typeof raw === "string" && OBJECTID_RE.test(raw)) return { $oid: raw };
  return raw;
}

function condComplete(c: Cond) {
  if (!c.field) return false;
  if (["$exists", "$type", "$null", "$notnull"].includes(c.operator)) return true;
  if (c.operator === "$in" || c.operator === "$nin") return Array.isArray(c.value) && c.value.length > 0;
  return c.value !== "" && c.value != null;
}

function condToObj(c: Cond, typeOf: (f: string) => string): any {
  const f = c.field, op = c.operator, t = typeOf(f);
  const val = (raw: any) => oidWrap(f, coerce(t, raw));
  if (op === "$eq") return { [f]: val(c.value) };
  if (["$ne", "$gt", "$gte", "$lt", "$lte"].includes(op)) return { [f]: { [op]: val(c.value) } };
  if (op === "$in" || op === "$nin") return { [f]: { [op]: c.value.map((v: any) => val(v)) } };
  if (op === "$regex") {
    const inner: any = { $regex: String(c.value) };
    if (c.ci) inner.$options = "i";
    return { [f]: inner };
  }
  if (op === "$exists") return { [f]: { $exists: c.value === true || c.value === "true" } };
  if (op === "$type") return { [f]: { $type: String(c.value || "string") } };
  if (op === "$null") return { [f]: null };
  if (op === "$notnull") return { [f]: { $ne: null } };
  return {};
}

function isSingleFieldObj(o: any) {
  const keys = Object.keys(o);
  return keys.length === 1 && keys[0].charAt(0) !== "$";
}

function buildNode(node: Cond | Group, typeOf: (f: string) => string): any {
  if (node.type === "cond") return condComplete(node) ? condToObj(node, typeOf) : null;
  const kids = node.children.map((ch) => buildNode(ch, typeOf)).filter(Boolean);
  if (kids.length === 0) return null;
  if (kids.length === 1) return kids[0];
  if (node.logic === "AND") {
    const flat: any = {}; let canFlat = true;
    for (const k of kids) {
      if (!isSingleFieldObj(k)) { canFlat = false; break; }
      const key = Object.keys(k)[0];
      if (key in flat) { canFlat = false; break; }
      flat[key] = k[key];
    }
    return canFlat ? flat : { $and: kids };
  }
  return { $or: kids };
}

/* ============================== tree factory ============================== */
const newCond = (): Cond => ({ type: "cond", field: "", operator: "$eq", value: "", ci: false });
const newGroup = (): Group => ({ type: "group", logic: "OR", children: [newCond()] });
const emptyTree = (): Group => ({ type: "group", logic: "AND", children: [newCond()] });

/* ============================== floating dropdown ============================== */
interface DropdownProps {
  triggerContent: React.ReactNode;
  ariaLabel: string;
  items: any[];
  getMain: (it: any) => string;
  getVal: (it: any) => any;
  getSide?: (it: any) => string;
  sideClass?: string;
  mono?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  selectedVal: any;
  minWidth?: number;
  allowCustom?: boolean;
  getCustomItem?: (text: string) => any;
  onSelect: (it: any) => void;
}

function Dropdown(p: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: p.minWidth || 200 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!p.searchable || !filter) return p.items;
    const q = filter.toLowerCase();
    return p.items.filter(
      (it) => p.getMain(it).toLowerCase().includes(q) || (p.getSide ? String(p.getSide(it)).toLowerCase().includes(q) : false),
    );
  }, [filter, p.items, p.searchable]);

  // When custom entry is allowed, offer the typed text as a selectable option
  // (unless it already matches an existing item exactly).
  const customText = filter.trim();
  const showCustom =
    !!p.allowCustom &&
    !!customText &&
    !p.items.some((it) => String(p.getMain(it)).toLowerCase() === customText.toLowerCase());
  const displayItems = useMemo(
    () => (showCustom ? [...filtered, { __custom: true, __text: customText }] : filtered),
    [filtered, showCustom, customText],
  );

  const reposition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, p.minWidth || 200);
    let left = r.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    const mh = menuRef.current?.offsetHeight || 260;
    let top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8 && r.top - mh - 6 > 8) top = r.top - mh - 6;
    setPos({ left, top, width });
  }, [p.minWidth]);

  useEffect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => reposition();
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("mousedown", onDown, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("mousedown", onDown, true);
    };
  }, [open, reposition]);

  // reposition once the menu has rendered (so height is known for flip-up)
  useEffect(() => { if (open) reposition(); }, [open, displayItems.length, reposition]);

  const choose = (it: any) => {
    setOpen(false);
    if (it && it.__custom) { p.onSelect(p.getCustomItem ? p.getCustomItem(it.__text) : it.__text); return; }
    p.onSelect(it);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(displayItems.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (displayItems[activeIdx]) choose(displayItems[activeIdx]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={s.ddTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={p.ariaLabel}
        onClick={() => { setOpen((o) => !o); setFilter(""); setActiveIdx(0); }}
      >
        {p.triggerContent}
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className={s.menu}
          role="listbox"
          tabIndex={-1}
          style={{ left: pos.left, top: pos.top, width: pos.width }}
          onKeyDown={onKeyDown}
        >
          {p.searchable && (
            <div className={s.menuSearch}>
              <input
                autoFocus
                type="text"
                placeholder={p.searchPlaceholder || "Search…"}
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setActiveIdx(0); }}
                onKeyDown={onKeyDown}
              />
            </div>
          )}
          <div className={s.menuList}>
            {displayItems.length === 0 && <div className={s.menuEmpty}>No matches</div>}
            {displayItems.map((it, idx) => {
              if (it && it.__custom) {
                return (
                  <button
                    key="__custom"
                    type="button"
                    role="option"
                    aria-selected={false}
                    className={`${s.menuItem} ${idx === activeIdx ? s.active : ""}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => choose(it)}
                  >
                    <span className={s.miMain}>
                      Use <span className={p.mono ? s.isMono : ""}>“{it.__text}”</span>
                    </span>
                    <span className={p.sideClass === "type" ? s.miType : s.miMql}>custom</span>
                  </button>
                );
              }
              const val = p.getVal(it);
              const selected = val === p.selectedVal;
              return (
                <button
                  key={String(val)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${s.menuItem} ${selected ? s.selected : ""} ${idx === activeIdx ? s.active : ""}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => choose(it)}
                >
                  <span className={`${s.miMain} ${p.mono ? s.isMono : ""}`}>{p.getMain(it)}</span>
                  {p.getSide && <span className={p.sideClass === "type" ? s.miType : s.miMql}>{p.getSide(it)}</span>}
                  <span className={s.miCheck}><Check /></span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ============================== chips input ============================== */
function ChipsInput({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = () => {
    const raw = text.trim().replace(/,$/, "").trim();
    if (raw) { onChange([...values, raw]); setText(""); }
  };
  return (
    <div className={s.chips} onMouseDown={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); inputRef.current?.focus(); } }}>
      {values.map((v, i) => (
        <span key={i} className={s.chip}>
          {v}
          <button type="button" className={s.chipX} aria-label={`Remove ${v}`} onClick={(e) => { e.stopPropagation(); onChange(values.filter((_, j) => j !== i)); }}>
            <X />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className={s.chipInput}
        type="text"
        placeholder={values.length ? "add…" : "type & Enter"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
          else if (e.key === "Backspace" && text === "" && values.length) onChange(values.slice(0, -1));
        }}
      />
    </div>
  );
}

/* ============================== main modal ============================== */
export default function FilterBuilderModal(p: Props) {
  const typeOf = useCallback(
    (name: string) => p.fields.find((f) => f.name === name)?.type || "string",
    [p.fields],
  );

  const rootRef = useRef<Group>(emptyTree());
  const [, force] = useReducer((x) => x + 1, 0);
  const rerender = () => force();

  const [mode, setMode] = useState<"visual" | "query">("visual");
  const [queryText, setQueryText] = useState(`db.getCollection('${p.collection}').find({})`);
  const [validMsg, setValidMsg] = useState<{ ok: boolean; label: string; msg: string }>({ ok: true, label: "Valid filter", msg: "" });
  const [copied, setCopied] = useState(false);

  const qInputRef = useRef<HTMLTextAreaElement>(null);
  const qHighlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Reset the builder only when the target collection changes — NOT on every
  // open, so a filter the user built earlier survives closing & reopening.
  useEffect(() => {
    rootRef.current = emptyTree();
    setMode("visual");
    setQueryText(`db.getCollection('${p.collection}').find({})`);
    setValidMsg({ ok: true, label: "Valid filter", msg: "" });
    rerender();
  }, [p.collection]);

  // current built filter (visual mode) — recomputed every render; rerender() drives updates
  const currentFilter = buildNode(rootRef.current, typeOf) || {};

  /* ---- query editor sync + validation ---- */
  const validateQuery = useCallback((text: string) => {
    try {
      const parsed = p.parseQuery(text.trim() || `db.getCollection('${p.collection}').find({})`);
      setValidMsg({ ok: true, label: "Valid", msg: parsed.operation === "find" ? "find" : parsed.operation });
      return true;
    } catch (err: any) {
      setValidMsg({ ok: false, label: "Invalid query", msg: err?.message || "Parse error" });
      return false;
    }
  }, [p]);

  const syncScroll = () => {
    const ta = qInputRef.current;
    if (!ta) return;
    if (qHighlightRef.current?.parentElement) {
      qHighlightRef.current.parentElement.scrollTop = ta.scrollTop;
      qHighlightRef.current.parentElement.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.style.transform = `translateY(${-ta.scrollTop}px)`;
  };

  useEffect(() => {
    if (mode === "query") { validateQuery(queryText); setTimeout(() => qInputRef.current?.focus(), 0); }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const gutterLines = queryText.split("\n").length;

  /* ---- mutations ---- */
  const removeNode = (node: Cond | Group) => {
    const walk = (g: Group): boolean => {
      const i = g.children.indexOf(node);
      if (i !== -1) { g.children.splice(i, 1); return true; }
      for (const ch of g.children) if (ch.type === "group" && walk(ch)) return true;
      return false;
    };
    walk(rootRef.current);
    if (rootRef.current.children.length === 0) rootRef.current.children.push(newCond());
    rerender();
  };

  const adjustForOperator = (c: Cond, prevOp: string) => {
    const op = c.operator;
    if (op === "$in" || op === "$nin") {
      if (!Array.isArray(c.value)) c.value = c.value !== "" && c.value != null ? [String(c.value)] : [];
    } else if (prevOp === "$in" || prevOp === "$nin") {
      c.value = Array.isArray(c.value) && c.value.length ? String(c.value[0]) : "";
    } else if (op === "$exists") {
      c.value = c.value === "false" ? "false" : "true";
    } else if (op === "$type") {
      c.value = BSON_TYPES.includes(c.value) ? c.value : "string";
    } else if (Array.isArray(c.value) || prevOp === "$exists" || prevOp === "$type") {
      c.value = typeOf(c.field) === "boolean" ? "true" : "";
    }
  };
  const adjustForField = (c: Cond) => {
    if (c.operator === "$in" || c.operator === "$nin") { if (!Array.isArray(c.value)) c.value = []; return; }
    if (c.operator === "$exists") { if (c.value !== "false" && c.value !== "true") c.value = "true"; return; }
    if (c.operator === "$type") { if (!BSON_TYPES.includes(c.value)) c.value = "string"; return; }
    const t = typeOf(c.field);
    if (t === "boolean") c.value = c.value === "true" || c.value === "false" ? c.value : "true";
    else if (Array.isArray(c.value)) c.value = "";
  };

  /* ---- actions ---- */
  const handleApply = () => {
    if (mode === "visual") {
      p.onRunFind(buildNode(rootRef.current, typeOf) || {});
      p.onClose();
      return;
    }
    let parsed: ParsedQuery;
    try { parsed = p.parseQuery(queryText.trim() || `db.getCollection('${p.collection}').find({})`); }
    catch (err: any) { setValidMsg({ ok: false, label: "Invalid query", msg: err?.message || "Parse error" }); return; }
    if (parsed.operation === "find") p.onRunFind(parsed.filter, (parsed as any).sort);
    else p.onRequestWrite(parsed);
    p.onClose();
  };

  const handleReset = () => {
    if (mode === "visual") { rootRef.current = emptyTree(); rerender(); }
    else { const t = `db.getCollection('${p.collection}').find({})`; setQueryText(t); validateQuery(t); }
  };

  const handleDeleteMatching = () => {
    p.onRequestWrite({ operation: "deleteMany", filter: buildNode(rootRef.current, typeOf) || {} });
    p.onClose();
  };

  const fromVisual = () => {
    const t = `db.getCollection('${p.collection}').find(${toJSON(buildNode(rootRef.current, typeOf) || {}, true, 0)})`;
    setQueryText(t);
    validateQuery(t);
  };

  const copyGen = () => {
    const text = toJSON(currentFilter, false, 0);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Esc closes the modal (when no dropdown captured it)
  useEffect(() => {
    if (!p.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") p.onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p.open, p]);

  if (!p.open) return null;

  /* ---- render helpers ---- */
  const renderValue = (c: Cond) => {
    const op = c.operator, t = typeOf(c.field);
    if (!c.field) return <input className={s.vinput} type="text" value="" readOnly disabled placeholder="—" />;
    if (op === "$null" || op === "$notnull") return <input className={s.vinput} type="text" value="" readOnly disabled placeholder="no value needed" />;
    // operator-specific inputs take precedence over field-type inputs
    if (op === "$type")
      return (
        <select className={s.vselect} value={BSON_TYPES.includes(c.value) ? c.value : "string"} onChange={(e) => { c.value = e.target.value; rerender(); }}>
          {BSON_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
        </select>
      );
    if (op === "$in" || op === "$nin")
      return <ChipsInput values={Array.isArray(c.value) ? c.value : []} onChange={(v) => { c.value = v; rerender(); }} />;
    if (op === "$exists" || t === "boolean")
      return (
        <select className={s.vselect} value={String(c.value) === "false" ? "false" : "true"} onChange={(e) => { c.value = e.target.value; rerender(); }}>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    if (t === "date")
      return <input className={s.vinput} type="date" value={Array.isArray(c.value) ? "" : c.value || ""} onChange={(e) => { c.value = e.target.value; rerender(); }} />;
    if (t === "number")
      return <input className={s.vinput} type="number" placeholder="0" value={Array.isArray(c.value) ? "" : c.value || ""} onChange={(e) => { c.value = e.target.value; rerender(); }} />;
    return (
      <>
        <input
          className={s.vinput}
          type="text"
          placeholder={op === "$regex" ? "pattern" : "value"}
          value={Array.isArray(c.value) ? "" : c.value || ""}
          onChange={(e) => { c.value = e.target.value; rerender(); }}
        />
        {op === "$regex" && (
          <button type="button" className={s.ciToggle} aria-pressed={c.ci} title='Case-insensitive ($options: "i")' onClick={() => { c.ci = !c.ci; rerender(); }}>i</button>
        )}
      </>
    );
  };

  const renderCondition = (c: Cond) => (
    <div className={s.cond}>
      <div className={s.cField}>
        <Dropdown
          ariaLabel={c.field ? `Field: ${c.field}` : "Select field"}
          triggerContent={c.field ? (
            <>
              <span className={`${s.ddMain} ${s.isMono}`}>{c.field}</span>
              <span className={s.ddHint}>{typeOf(c.field)}</span>
              <span className={s.ddCaret}><Caret /></span>
            </>
          ) : (
            <>
              <span className={`${s.ddMain} ${s.placeholder}`}>Select field</span>
              <span className={s.ddCaret}><Caret /></span>
            </>
          )}
          items={p.fields}
          mono
          minWidth={240}
          searchable
          allowCustom
          getCustomItem={(text) => ({ name: text, type: typeOf(text) })}
          searchPlaceholder="Search or type a field…"
          getMain={(it) => it.name}
          getVal={(it) => it.name}
          getSide={(it) => it.type}
          sideClass="type"
          selectedVal={c.field}
          onSelect={(it) => { c.field = it.name; adjustForField(c); rerender(); }}
        />
      </div>
      <div className={s.cOp}>
        <Dropdown
          ariaLabel={`Operator: ${opMap[c.operator].label}`}
          triggerContent={
            <>
              <span className={s.ddMain}>{opMap[c.operator].label}</span>
              <span className={s.ddHint}>{c.operator}</span>
              <span className={s.ddCaret}><Caret /></span>
            </>
          }
          items={OPERATORS}
          minWidth={230}
          getMain={(it) => it.label}
          getVal={(it) => it.op}
          getSide={(it) => it.op}
          selectedVal={c.operator}
          onSelect={(it) => { const prev = c.operator; c.operator = it.op; adjustForOperator(c, prev); rerender(); }}
        />
      </div>
      <div className={`${s.cValue} ${s.valueCell}`}>{renderValue(c)}</div>
      <button type="button" className={`${s.removeBtn} ${s.cRemove}`} aria-label="Remove condition" onClick={() => removeNode(c)}><X /></button>
    </div>
  );

  const renderGroup = (node: Group, depth: number): React.ReactNode => (
    <div className={depth === 0 ? s.group : `${s.group} ${s.groupNested}`}>
      <div className={depth === 0 ? s.matcher : s.groupHead}>
        <span className={s.matcherLabel}>Match</span>
        <div className={`${s.seg} ${s.segSm}`} role="tablist" aria-label="Match logic">
          {(["AND", "OR"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`${s.segBtn} ${s.mono} ${node.logic === v ? s.active : ""}`}
              style={{ letterSpacing: ".04em" }}
              aria-selected={node.logic === v}
              onClick={() => { node.logic = v; rerender(); }}
            >
              {v}
            </button>
          ))}
        </div>
        <span className={s.matcherTail}>of the following</span>
        {depth > 0 && (
          <button type="button" className={`${s.removeBtn} ${s.groupRemove}`} aria-label="Remove group" onClick={() => removeNode(node)}><X /></button>
        )}
      </div>

      <div className={s.conditions}>
        {node.children.map((child, idx) => (
          <div key={idx}>
            {idx > 0 && (
              <div className={s.connector}>
                <span className={s.connectorLine} />
                <button type="button" className={s.connectorBtn} aria-label={`Toggle match logic, currently ${node.logic}`} onClick={() => { node.logic = node.logic === "AND" ? "OR" : "AND"; rerender(); }}>
                  {node.logic}
                </button>
                <span className={s.connectorRest} />
              </div>
            )}
            {child.type === "cond" ? renderCondition(child) : renderGroup(child, depth + 1)}
          </div>
        ))}
      </div>

      <div className={s.addRow}>
        <button type="button" className={s.addBtn} onClick={() => { node.children.push(newCond()); rerender(); }}><Plus /> Add condition</button>
        {depth < 2 && (
          <button type="button" className={s.addBtn} onClick={() => { node.children.push(newGroup()); rerender(); }}><GroupGlyph /> Add group</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-8 overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) p.onClose(); }}>
      <div className={`${s.root} w-full max-w-[1000px] bg-white rounded-[10px] border border-[#e5e5e5] shadow-xl flex flex-col max-h-[calc(100vh-4rem)]`}>
        {/* top bar */}
        <div className={s.topbar}>
          <div className={s.crumb}>
            <span className={s.crumbColl}>
              <Collection />
              <span className={s.mono}>{p.collection}</span>
            </span>
            <span className={s.crumbSep} />
            <span className={`${s.crumbCount} ${s.mono}`}>{p.count.toLocaleString()} documents</span>
          </div>
          <div className={s.topbarActions}>
            <div className={`${s.seg} ${s.segInk}`} role="tablist" aria-label="Filter mode">
              <button type="button" className={`${s.segBtn} ${mode === "visual" ? s.active : ""}`} aria-selected={mode === "visual"} onClick={() => setMode("visual")}>Visual</button>
              <button type="button" className={`${s.segBtn} ${mode === "query" ? s.active : ""}`} aria-selected={mode === "query"} onClick={() => setMode("query")}>Query</button>
            </div>
            <span className={s.crumbSep} />
            {p.canDelete && mode === "visual" && (
              <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={handleDeleteMatching}>Delete matching</button>
            )}
            <button type="button" className={`${s.btn} ${s.btnDangerGhost}`} onClick={handleReset}>Reset</button>
            <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={handleApply}>Apply</button>
            <button type="button" className={s.iconBtn} aria-label="Close" onClick={p.onClose}><X /></button>
          </div>
        </div>

        {/* body */}
        <div className={s.panelBody}>
          {mode === "visual" ? (
            <div>
              {renderGroup(rootRef.current, 0)}
              <div className={s.gen}>
                <div className={s.genLabel}>
                  <span>Generated query</span>
                  <button type="button" className={s.copy} aria-label="Copy generated query" onClick={copyGen}>
                    {copied ? <Check /> : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4}><rect x="5.5" y="5.5" width="8" height="8" rx="1.4" /><path d="M3.5 10.5h-.5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v.5" /></svg>}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className={`${s.genCode} ${s.mono}`} dangerouslySetInnerHTML={{ __html: highlightJSON(toJSON(currentFilter, false, 0)) }} />
              </div>
            </div>
          ) : (
            <div>
              <div className={s.editorToolbar}>
                <button type="button" className={`${s.btn} ${s.btnGhost}`} title="Build a find() from the visual filter" onClick={fromVisual}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M13 8a5 5 0 1 1-1.46-3.54" /><path d="M13 2.5v3h-3" /></svg>
                  From visual
                </button>
                <span className={s.hint}>shell syntax · supports find / deleteMany / updateMany</span>
              </div>
              <div className={`${s.editor} ${validMsg.ok ? "" : s.invalid}`}>
                <div className={s.gutter}>
                  <div className={s.gutterInner} ref={gutterRef}>
                    {Array.from({ length: gutterLines }, (_, i) => <div key={i}>{i + 1}</div>)}
                  </div>
                </div>
                <div className={s.editorArea}>
                  <pre className={s.editorHighlight}><div ref={qHighlightRef} dangerouslySetInnerHTML={{ __html: highlightJSON(queryText) + (queryText.endsWith("\n") ? "\n" : "") }} /></pre>
                  <textarea
                    ref={qInputRef}
                    className={`${s.qInput} ${s.mono}`}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    aria-label="MongoDB query"
                    value={queryText}
                    onChange={(e) => { setQueryText(e.target.value); validateQuery(e.target.value); }}
                    onScroll={syncScroll}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleApply(); }
                      else if (e.key === "Tab") {
                        e.preventDefault();
                        const ta = e.currentTarget;
                        const st = ta.selectionStart, en = ta.selectionEnd;
                        const next = queryText.slice(0, st) + "  " + queryText.slice(en);
                        setQueryText(next); validateQuery(next);
                        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = st + 2; });
                      }
                    }}
                  />
                </div>
              </div>
              <div className={`${s.validation} ${validMsg.ok ? s.ok : s.err}`} aria-live="polite">
                {validMsg.ok ? (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="8" cy="8" r="6.2" /><path d="m5.4 8.1 1.8 1.8 3.4-3.6" /></svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M8 1.8 14.8 13H1.2L8 1.8Z" /><path d="M8 6.4v3" /><circle cx="8" cy="11.4" r=".3" fill="currentColor" stroke="none" /></svg>
                )}
                <span>{validMsg.label}</span>
                <span className={s.vmsg}>{validMsg.msg}</span>
              </div>
              <p className="mt-2 text-[11px] text-[#a3a3a3]">Ctrl+Enter / Apply to run · EJSON supported</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
