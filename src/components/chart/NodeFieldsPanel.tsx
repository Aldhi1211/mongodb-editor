"use client";

import { useState, useEffect } from "react";
import { ChevronRight, X, ListTree } from "lucide-react";
import type { Node } from "@xyflow/react";

/** Unwrap an EJSON number wrapper ($numberInt / $numberDouble / $numberLong) → number | null. */
function ejNum(v: any): number | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const k of ["$numberInt", "$numberDouble", "$numberLong"]) {
      if (k in v) { const n = Number(v[k]); return Number.isNaN(n) ? null : n; }
    }
  }
  return null;
}

const isPrimitive = (v: any) => v === null || typeof v !== "object";
const isScalar = (v: any) => isPrimitive(v) || ejNum(v) !== null;

function scalarText(v: any): string {
  const n = ejNum(v);
  if (n !== null) return String(n);
  if (v === null) return "null";
  if (typeof v === "string") return v;
  return String(v);
}

function scalarClass(v: any): string {
  if (ejNum(v) !== null) return "text-amber-300";
  if (v === null) return "text-[#555] italic";
  if (typeof v === "boolean") return v ? "text-emerald-300" : "text-rose-300";
  return "text-[#9aa0c4]";
}

/** A leaf "key: value" row. */
function LeafRow({ name, value }: { name: string; value: any }) {
  const text = isScalar(value)
    ? scalarText(value)
    : "[" + value.map((x: any) => scalarText(x)).join(", ") + "]"; // primitive array
  return (
    <div className="flex items-start gap-2 py-[1px] pl-4">
      <span className="text-[11px] font-mono text-[#7c8cf8] flex-shrink-0">{name}</span>
      <span className="text-[11px] font-mono text-[#3a3a3a]">:</span>
      <span className={`text-[11px] font-mono break-all ${isScalar(value) ? scalarClass(value) : "text-[#9aa0c4]"}`}>
        {text}
      </span>
    </div>
  );
}

/** Recursive collapsible renderer for any non-`fields` property value. */
function TreeNode({ name, value, depth }: { name: string; value: any; depth: number }) {
  const [open, setOpen] = useState(depth < 1);

  // Scalars & primitive arrays render inline.
  if (isScalar(value)) return <LeafRow name={name} value={value} />;
  if (Array.isArray(value)) {
    if (value.length === 0) return <LeafRow name={name} value={[]} />;
    if (value.every(isScalar)) return <LeafRow name={name} value={value} />;
  }

  const isArr = Array.isArray(value);
  const entries: [string, any][] = isArr
    ? (value as any[]).map((v, i) => [String(i), v])
    : Object.entries(value);
  const summary = isArr
    ? `[${value.length}]`
    : value?.label || value?.type
      ? `${value.label ?? ""}${value.type ? ` · ${value.type}` : ""}`.trim()
      : `{${entries.length}}`;

  return (
    <div className="pl-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 py-[1px] cursor-pointer group"
      >
        <ChevronRight
          className={`w-3 h-3 text-[#555] transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="text-[11px] font-mono text-[#bbb] group-hover:text-white">{name}</span>
        <span className="text-[10px] font-mono text-[#555]">{summary}</span>
      </button>
      {open && (
        <div className="ml-[6px] border-l border-[#222] pl-2">
          {entries.map(([k, v]) => (
            <TreeNode key={k} name={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/** A collapsible card for one field; nested `fields[]` recurse as nested cards. */
function FieldCard({ field, index }: { field: any; index: number }) {
  const [open, setOpen] = useState(false);
  const label = field?.label || field?.key || `Field ${index + 1}`;
  const type = field?.type as string | undefined;
  const nested = Array.isArray(field?.fields) ? field.fields : [];
  const props = Object.entries(field || {}).filter(([k]) => k !== "fields");

  return (
    <div className="rounded-lg border border-[#222] bg-[#131313] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-[#1a1a1a] transition-colors cursor-pointer"
      >
        <ChevronRight
          className={`w-3.5 h-3.5 text-[#555] flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="text-[12px] font-semibold text-white truncate flex-1 text-left">{label}</span>
        {field?.key && field.key !== label && (
          <span className="text-[10px] font-mono text-[#555] flex-shrink-0">{field.key}</span>
        )}
        {type && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#7c8cf8] bg-[#7c8cf8]/10 border border-[#7c8cf8]/25 rounded px-1.5 py-0.5 flex-shrink-0">
            {type}
          </span>
        )}
      </button>

      {open && (
        <div className="px-2.5 pb-2.5 pt-1.5 border-t border-[#1f1f1f] space-y-[1px]">
          {props.map(([k, v]) => (
            <TreeNode key={k} name={k} value={v} depth={0} />
          ))}
          {nested.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#1f1f1f]">
              <p className="text-[10px] uppercase tracking-wider text-[#555] mb-1.5 flex items-center gap-1">
                <ListTree className="w-3 h-3" />
                Sub-fields ({nested.length})
              </p>
              <div className="space-y-1.5">
                {nested.map((sf: any, i: number) => (
                  <FieldCard key={i} field={sf} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NodeFieldsPanel({ node, onClose }: { node: Node; onClose: () => void }) {
  const fields = (node?.data?.fields as any[]) ?? [];
  const title = (node?.data?.label as string) || node.id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute top-0 right-0 h-full w-[360px] bg-[#0c0c0c] border-l border-[#1f1f1f] z-10 flex flex-col shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-3.5 h-12 border-b border-[#1a1a1a] flex-shrink-0">
        <ListTree className="w-4 h-4 text-[#7c8cf8] flex-shrink-0" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[13px] font-semibold text-white truncate leading-tight">{title}</span>
          <span className="text-[10px] text-[#555] leading-tight">
            {fields.length} field{fields.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#555] hover:text-white p-1 rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <ListTree className="w-7 h-7 text-[#2a2a2a]" />
            <p className="text-[12px] text-[#444]">This node has no fields</p>
          </div>
        ) : (
          fields.map((f, i) => <FieldCard key={i} field={f} index={i} />)
        )}
      </div>
    </div>
  );
}
