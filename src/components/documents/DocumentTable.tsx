"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { EJSON } from "bson";
import { useDocuments } from "./useDocuments";
import DocumentContextMenu from "./DocumentContextMenu";
import JsonViewerModal from "./JsonViewerModal";
import FilterBuilderModal, { FieldDef } from "./FilterBuilderModal";
import Breadcrumb from "@/components/Breadcrumb";
import { getEjsonIdString, toShellString } from "@/lib/ejsonShell";
import { Loader2, Trash2 } from "lucide-react";

type WriteOp = "deleteOne" | "deleteMany" | "updateOne" | "updateMany";
type ParsedQuery =
  | { operation: "find"; filter: any; sort?: any }
  | { operation: WriteOp; filter: any; update?: any };

export default function DocumentTable({ roomId, collection, userRole = "viewer", cluster, onEdit, onNew, onNavigateCluster }: any) {
  const canWrite = userRole !== "viewer";
  const canDelete = userRole === "owner" || userRole === "admin";
  const {
    data,
    fetchData,
    queryData,
    deleteDoc,
    page,
    setPage,
    total,
    limit,
    isFetching,
  } = useDocuments(roomId, collection);

  const [isJsonViewOpen, setIsJsonViewOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [contextRow, setContextRow] = useState<any>(null);
  const [menuPos, setMenuPos] = useState<any>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<any>(null);
  const [pendingBulkOp, setPendingBulkOp] = useState<ParsedQuery | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingSelDelete, setPendingSelDelete] = useState(false);
  const [selDeleting, setSelDeleting] = useState(false);

  // Drop the selection when the page / collection changes.
  useEffect(() => { setSelected(new Set()); }, [page, collection]);

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const formatCellValue = useCallback((value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-300">—</span>;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    const formatted = toShellString(value);
    if (formatted.includes("\n")) return JSON.stringify(value);
    return formatted;
  }, []);

  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!data.length) return [];
    return [
      {
        id: "__rownum__",
        header: "#",
        cell: (info) => {
          const num = (page - 1) * limit + info.row.index + 1;
          const sel = selectionRef.current;
          if (!sel?.canWrite) {
            return <span className="text-gray-400 text-[11px] select-none">{num}</span>;
          }
          const id = getEjsonIdString(info.row.original._id);
          const isSel = sel.selected.has(id);
          return (
            <span
              className="relative flex items-center justify-end w-full h-4"
              onClick={(e) => e.stopPropagation()}
            >
              {!isSel && (
                <span className="absolute right-0 text-gray-400 text-[11px] select-none group-hover:opacity-0 pointer-events-none">
                  {num}
                </span>
              )}
              <input
                type="checkbox"
                checked={isSel}
                onChange={() => sel.toggle(id)}
                className={`w-3.5 h-3.5 cursor-pointer accent-neutral-900 ${isSel ? "" : "opacity-0 group-hover:opacity-100"}`}
              />
            </span>
          );
        },
      },
      ...Object.keys(data[0]).map((key) => ({
        accessorKey: key,
        header: key,
        cell: (info: any) => {
          const raw = info.getValue();
          const display = formatCellValue(raw);
          if (key === "_id") {
            return <span className="text-gray-400 text-[11px]">{String(display)}</span>;
          }
          if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
            return <span className="text-[#0369a1] text-[11px]">{String(display)}</span>;
          }
          if (Array.isArray(raw)) {
            return <span className="text-[#7c3aed] text-[11px]">{JSON.stringify(raw)}</span>;
          }
          return display;
        },
      })),
    ];
  }, [data, formatCellValue, page, limit]);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  // Derive a field list (name + inferred type) from the loaded documents for the filter builder.
  const fields = useMemo<FieldDef[]>(() => {
    const sample = data[0];
    if (!sample) return [];
    return Object.keys(sample).map((name) => {
      const v = sample[name];
      let type = "string";
      if (name === "_id") type = "objectId";
      else if (typeof v === "number") type = "number";
      else if (typeof v === "boolean") type = "boolean";
      else if (Array.isArray(v)) type = "array";
      else if (v && typeof v === "object") {
        if ("$oid" in v) type = "objectId";
        else if ("$date" in v) type = "date";
        else if ("$numberInt" in v || "$numberLong" in v || "$numberDouble" in v || "$numberDecimal" in v) type = "number";
        else type = "object";
      }
      return { name, type };
    });
  }, [data]);

  const openEdit = (doc: any) => onEdit?.(doc);

  // Split "arg1, arg2" at the first top-level comma (handles nested objects/arrays)
  const splitTwoArgs = (inner: string): [string, string] | null => {
    let depth = 0;
    for (let i = 0; i < inner.length; i++) {
      const c = inner[i];
      if (c === '{' || c === '[' || c === '(') depth++;
      else if (c === '}' || c === ']' || c === ')') depth--;
      else if (c === ',' && depth === 0) {
        return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
      }
    }
    return null;
  };

  // Extract content inside the first matching parentheses of a chained method call
  const extractMethodArg = (raw: string, method: string): string | null => {
    const match = raw.match(new RegExp(`\\.${method}\\s*\\(`));
    if (!match || match.index === undefined) return null;
    const openIdx = raw.indexOf('(', match.index + match[0].length - 1);
    if (openIdx === -1) return null;
    let depth = 1, i = openIdx + 1;
    while (i < raw.length && depth > 0) {
      if (raw[i] === '(') depth++;
      else if (raw[i] === ')') depth--;
      i++;
    }
    return raw.slice(openIdx + 1, i - 1).trim();
  };

  // Parse db.getCollection(...).METHOD(...) — returns typed ParsedQuery
  const parseQueryString = (raw: string): ParsedQuery => {
    const trimmed = raw.trim();

    // Check for write operations first
    const writeOps: WriteOp[] = ["deleteOne", "deleteMany", "updateOne", "updateMany"];
    for (const op of writeOps) {
      const argInner = extractMethodArg(trimmed, op);
      if (argInner !== null) {
        if (op === "updateOne" || op === "updateMany") {
          const parts = splitTwoArgs(argInner);
          if (!parts) throw new Error(`${op}() requires two arguments: (filter, update)`);
          const [filterStr, updateStr] = parts;
          const filter = filterStr && filterStr !== '{}' ? EJSON.parse(filterStr) : {};
          const update = EJSON.parse(updateStr);
          return { operation: op, filter, update };
        } else {
          const filter = argInner && argInner !== '{}' ? EJSON.parse(argInner) : {};
          return { operation: op, filter };
        }
      }
    }

    // Default: find
    const findArg = extractMethodArg(trimmed, 'find');
    let filter: any = {};
    if (findArg !== null) {
      if (findArg && findArg !== '{}') filter = EJSON.parse(findArg);
    } else {
      if (trimmed && trimmed !== '{}') filter = EJSON.parse(trimmed);
    }

    let sort: any = undefined;
    const sortArg = extractMethodArg(trimmed, 'sort');
    if (sortArg !== null && sortArg && sortArg !== '{}') {
      sort = EJSON.parse(sortArg);
    }

    return { operation: "find", filter, sort };
  };

  // Called by the filter modal when it produces a find filter
  const handleRunFind = async (filter: any, sort?: any) => {
    const filtered = (filter && Object.keys(filter).length > 0) || !!sort;
    setActiveFilter(filtered ? filter : null);
    await queryData(filter, 1, sort);
  };

  // Drop the active filter and reload the unfiltered collection
  const clearFilter = async () => {
    setActiveFilter(null);
    setPage(1);
    await fetchData(1);
  };

  // Refresh: re-run the active filter if there is one, otherwise reload the page
  const refreshDocuments = async () => {
    if (activeFilter) await queryData(activeFilter, page);
    else await fetchData(page);
  };

  const executeBulkOp = async (op: ParsedQuery) => {
    if (op.operation === "find") return;
    setPendingBulkOp(null);
    try {
      const token = localStorage.getItem("token");
      const body: any = { operation: op.operation, filter: EJSON.serialize(op.filter, { relaxed: false }) };
      if (op.operation === "updateOne" || op.operation === "updateMany") {
        body.update = EJSON.serialize((op as any).update, { relaxed: false });
      }
      const res = await fetch(
        `/api/rooms/${roomId}/collections/${collection}/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setBulkResult(`Error: ${json.error || "Operation failed"}`);
        return;
      }
      if (op.operation === "deleteOne" || op.operation === "deleteMany") {
        setBulkResult(`Deleted ${json.deletedCount} document${json.deletedCount !== 1 ? "s" : ""}`);
      } else {
        setBulkResult(`Matched ${json.matchedCount}, modified ${json.modifiedCount} document${json.modifiedCount !== 1 ? "s" : ""}`);
      }
      setActiveFilter(null);
      await fetchData(1);
    } catch (err: any) {
      setBulkResult(`Error: ${err?.message || "Operation failed"}`);
    }
  };

  const startRow = (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  // ── Row selection (for multi-delete) ──
  const pageIds = data.map((d: any) => getEjsonIdString(d._id));
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));
  const toggleAll = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (allSelected) pageIds.forEach((id) => n.delete(id));
      else pageIds.forEach((id) => n.add(id));
      return n;
    });

  // Keep a live ref so memoized cell renderers read fresh selection state
  // without rebuilding the column definitions on every toggle.
  const selectionRef = useRef<{ selected: Set<string>; toggle: (id: string) => void; canWrite: boolean }>({
    selected,
    toggle: toggleRow,
    canWrite,
  });
  selectionRef.current = { selected, toggle: toggleRow, canWrite };

  const deleteSelected = async () => {
    const ids = data.filter((d: any) => selected.has(getEjsonIdString(d._id))).map((d: any) => d._id);
    if (!ids.length) { setPendingSelDelete(false); return; }
    setSelDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/rooms/${roomId}/collections/${collection}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ operation: "deleteMany", filter: { _id: { $in: ids } } }),
      });
      const json = await res.json();
      if (res.ok) {
        setBulkResult(`Deleted ${json.deletedCount} document${json.deletedCount !== 1 ? "s" : ""}`);
      } else {
        setBulkResult(`Error: ${json.error || "Delete failed"}`);
      }
      setSelected(new Set());
      setPendingSelDelete(false);
      await refreshDocuments();
    } finally {
      setSelDeleting(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
      {/* Sub-toolbar: breadcrumb (cluster / collection) + actions + count + Filter */}
      <Breadcrumb
        cluster={cluster}
        collection={collection}
        onClusterClick={onNavigateCluster}
        right={
          <>
            <button
              className="px-3 py-1 rounded-md text-[12px] text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer"
              onClick={() => setIsJsonViewOpen(true)}
            >
              JSON
            </button>

            {activeFilter && (
              <span
                title={JSON.stringify(EJSON.serialize(activeFilter, { relaxed: false }))}
                className="flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-medium whitespace-nowrap"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3"><path d="M2 3.5h12M4.5 8h7M6.5 12.5h3" /></svg>
                Filtered
                <button
                  onClick={clearFilter}
                  aria-label="Clear filter"
                  className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full text-amber-600 hover:bg-amber-200 hover:text-amber-800 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            <span className="font-mono text-[12px] text-neutral-400 whitespace-nowrap">
              {total > 0 ? `${startRow}–${endRow} of ${total} documents` : `${total} documents`}
            </span>

            <button
              onClick={() => setFilterOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium cursor-pointer flex-shrink-0 ${
                activeFilter
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-[#111] text-white hover:bg-[#333]"
              }`}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5"><path d="M2 3.5h12M4.5 8h7M6.5 12.5h3" /></svg>
              Filter
            </button>
          </>
        }
      />

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0 relative">
        {isFetching && (
          <div className="mongo-progress-track text-neutral-900 sticky top-0 left-0 right-0 z-30" />
        )}
        {isFetching && data.length === 0 ? (
          <div className="px-4 py-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                <div className="h-3 w-6 rounded bg-gray-100 flex-shrink-0" />
                <div className="h-3 rounded bg-gray-100" style={{ width: `${160 + (i % 5) * 60}px` }} />
                <div className="h-3 w-16 rounded bg-gray-100" />
                <div className="h-3 w-24 rounded bg-gray-100 hidden sm:block" />
                <div className="h-3 w-20 rounded bg-gray-100 hidden md:block ml-auto" />
              </div>
            ))}
          </div>
        ) : (
        <table className="border-collapse text-[12px] font-mono min-w-max w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              {table.getHeaderGroups()[0]?.headers.map((h, i) => (
                <th
                  key={h.id}
                  className={`px-3.5 py-2 text-left border-b border-r border-gray-200 bg-gray-50 whitespace-nowrap text-[11px] font-medium text-gray-500 uppercase tracking-[0.04em] last:border-r-0
                    ${i === 0 ? "sticky left-0 z-20 bg-gray-50 border-r border-gray-200 w-9 text-right pr-2" : ""}
                  `}
                >
                  {i === 0 ? (
                    canWrite ? (
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 cursor-pointer accent-neutral-900 align-middle"
                      />
                    ) : "#"
                  ) : (
                    <span className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <span className="text-gray-300">↕</span>
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isCtx = contextRow && getEjsonIdString(row.original._id) === getEjsonIdString(contextRow._id);
              return (
                <tr
                  key={row.id}
                  className={`group cursor-pointer ${isCtx ? "bg-[#111]" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    if (canWrite) openEdit(row.original);
                    else setViewDoc(row.original);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextRow(row.original);
                    setMenuPos({ x: e.clientX, y: e.clientY });
                  }}
                >
                  {row.getVisibleCells().map((cell, i) => (
                    <td
                      key={cell.id}
                      className={`px-3.5 py-[7px] border-b border-r whitespace-nowrap last:border-r-0 max-w-[260px] overflow-hidden text-ellipsis align-middle
                        ${isCtx
                          ? i === 0
                            ? "sticky left-0 z-10 bg-[#111] border-r border-[#333] text-right pr-2 w-9 text-[11px] text-gray-500 select-none"
                            : "border-gray-800 text-gray-100"
                          : i === 0
                            ? "sticky left-0 z-10 bg-white group-hover:bg-gray-100 border-r border-gray-200 border-gray-100 text-right pr-2 w-9 text-[11px] text-gray-400 select-none"
                            : "border-gray-100 text-gray-800 group-hover:bg-gray-100"
                        }
                      `}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 flex-shrink-0">
          <span className="text-[11px] text-gray-400">{startRow}–{endRow} of {total}</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              className="px-3 py-1 rounded-md border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              onClick={() => { const p = page - 1; setPage(p); fetchData(p); }}
            >
              ‹ Prev
            </button>
            <button
              disabled={page * limit >= total}
              className="px-3 py-1 rounded-md border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              onClick={() => { const p = page + 1; setPage(p); fetchData(p); }}
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* Filter builder modal */}
      <FilterBuilderModal
        open={filterOpen}
        collection={collection}
        fields={fields}
        count={total}
        canDelete={canDelete}
        parseQuery={parseQueryString}
        onRunFind={handleRunFind}
        onRequestWrite={(op) => setPendingBulkOp(op)}
        onClose={() => setFilterOpen(false)}
      />

      <DocumentContextMenu
        pos={menuPos}
        userRole={userRole}
        onAdd={() => onNew?.()}
        onDelete={() => {
          setPendingDelete(contextRow);
          setMenuPos(null);
        }}
        onView={() => setViewDoc(contextRow)}
        onUpdate={() => openEdit(contextRow)}
        onRefresh={refreshDocuments}
        onClose={() => { setMenuPos(null); setContextRow(null); }}
      />

      <JsonViewerModal open={isJsonViewOpen} onClose={setIsJsonViewOpen} data={data} />
      <JsonViewerModal open={!!viewDoc} onClose={() => setViewDoc(null)} data={viewDoc} />

      {/* Bulk operation confirmation dialog */}
      {pendingBulkOp && pendingBulkOp.operation !== "find" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-900">
                Confirm: <span className="font-mono text-red-600">{pendingBulkOp.operation}</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">This will modify data. Review before executing.</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Filter</p>
                <pre className="text-[11px] font-mono bg-gray-50 border border-gray-200 rounded-md px-3 py-2 overflow-auto max-h-32 text-gray-700">
                  {JSON.stringify(EJSON.serialize(pendingBulkOp.filter, { relaxed: false }), null, 2)}
                </pre>
              </div>
              {(pendingBulkOp.operation === "updateOne" || pendingBulkOp.operation === "updateMany") && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Update</p>
                  <pre className="text-[11px] font-mono bg-gray-50 border border-gray-200 rounded-md px-3 py-2 overflow-auto max-h-32 text-gray-700">
                    {JSON.stringify(EJSON.serialize((pendingBulkOp as any).update, { relaxed: false }), null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-5 pb-4 flex justify-end gap-2">
              <button
                className="px-4 py-1.5 rounded-md border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                onClick={() => setPendingBulkOp(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1.5 rounded-md bg-red-600 text-white text-[12px] font-medium hover:bg-red-700 cursor-pointer"
                onClick={() => executeBulkOp(pendingBulkOp)}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single document delete confirmation dialog */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-900">
                Delete <span className="font-mono text-red-600">document</span>?
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">This action cannot be undone.</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">_id</p>
              <pre className="text-[11px] font-mono bg-gray-50 border border-gray-200 rounded-md px-3 py-2 overflow-auto max-h-32 text-gray-700">
                {getEjsonIdString(pendingDelete?._id)}
              </pre>
            </div>
            <div className="px-5 pb-4 flex justify-end gap-2">
              <button
                className="px-4 py-1.5 rounded-md border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1.5 rounded-md bg-red-600 text-white text-[12px] font-medium hover:bg-red-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteDoc(getEjsonIdString(pendingDelete?._id));
                    await fetchData();
                    setPendingDelete(null);
                    setContextRow(null);
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection action bar */}
      {selected.size > 0 && !pendingSelDelete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 pl-4 pr-2.5 py-2 bg-neutral-900 text-white text-[12px] rounded-lg shadow-xl">
          <span className="font-medium">{selected.size} selected</span>
          <button
            className="text-gray-300 hover:text-white cursor-pointer"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer"
            onClick={() => setPendingSelDelete(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Selection delete confirmation dialog */}
      {pendingSelDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-900">
                Delete <span className="font-mono text-red-600">{selected.size}</span> document{selected.size !== 1 ? "s" : ""}?
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">This action cannot be undone.</p>
            </div>
            <div className="px-5 pb-4 pt-4 flex justify-end gap-2">
              <button
                className="px-4 py-1.5 rounded-md border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={selDeleting}
                onClick={() => setPendingSelDelete(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1.5 rounded-md bg-red-600 text-white text-[12px] font-medium hover:bg-red-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={selDeleting}
                onClick={deleteSelected}
              >
                {selDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {selDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk result banner */}
      {bulkResult && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-gray-900 text-white text-[12px] rounded-lg shadow-xl">
          <span>{bulkResult}</span>
          <button className="text-gray-400 hover:text-white cursor-pointer text-[11px]" onClick={() => setBulkResult(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
