"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getEjsonIdString, toShellString } from "@/lib/ejsonShell";

type Operator = "is" | "regex" | "gt" | "lt";
type Filter = { key: string; operator: Operator; value: string };
type QueryMode = "filter" | "query";
type WriteOp = "deleteOne" | "deleteMany" | "updateOne" | "updateMany";
type ParsedQuery =
  | { operation: "find"; filter: any; sort?: any }
  | { operation: WriteOp; filter: any; update?: any };

export default function DocumentTable({ roomId, collection, userRole = "viewer" }: any) {
  const canWrite = userRole !== "viewer";
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([{ key: "", operator: "is", value: "" }]);
  const [filterMode, setFilterMode] = useState<"and" | "or">("and");
  const [queryMode, setQueryMode] = useState<QueryMode>("filter");
  const [rawQuery, setRawQuery] = useState("");
  const [rawSort, setRawSort] = useState("");
  const [queryError, setQueryError] = useState<string | null>(null);
  const [pendingBulkOp, setPendingBulkOp] = useState<ParsedQuery | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

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
        cell: (info) => (
          <span className="text-gray-400 text-[11px] select-none">
            {(page - 1) * limit + info.row.index + 1}
          </span>
        ),
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

  const openNew = () => {
    router.push(`/edit?roomId=${roomId}&collection=${encodeURIComponent(collection)}&mode=new`);
  };

  const openEdit = (doc: any) => {
    sessionStorage.setItem("edit_doc", EJSON.stringify(doc));
    router.push(
      `/edit?roomId=${roomId}&collection=${encodeURIComponent(collection)}&docId=${getEjsonIdString(doc._id)}`
    );
  };

  const updateFilter = <K extends keyof Filter>(index: number, field: K, value: Filter[K]) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  const buildQuery = () => {
    const conditions: any[] = [];
    filters.forEach((f) => {
      if (!f.key) return;
      const value = isNaN(Number(f.value)) ? f.value : Number(f.value);
      const isObjectIdLike = /^[0-9a-fA-F]{24}$/.test(f.value);
      const cond: any = {};
      switch (f.operator) {
        case "is":
          if (f.key === "_id" && isObjectIdLike) {
            cond["$or"] = [{ _id: { $oid: f.value } }, { _id: f.value }];
          } else {
            cond[f.key] = value;
          }
          break;
        case "regex": cond[f.key] = { $regex: f.value, $options: "i" }; break;
        case "gt": cond[f.key] = { $gt: value }; break;
        case "lt": cond[f.key] = { $lt: value }; break;
      }
      conditions.push(cond);
    });
    if (conditions.length === 0) return {};
    if (conditions.length === 1 || filterMode === "and") return Object.assign({}, ...conditions);
    return { $or: conditions };
  };

  const defaultQueryTemplate = () => `db.getCollection('${collection}').find({})`;

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

  const handleRunRawQuery = async () => {
    setQueryError(null);
    setBulkResult(null);
    const trimmed = rawQuery.trim();
    let parsed: ParsedQuery = { operation: "find", filter: {} };
    if (trimmed) {
      try {
        parsed = parseQueryString(trimmed);
      } catch (err: any) {
        setQueryError(err.message);
        return;
      }
    }
    if (parsed.operation === "find") {
      setLoading(true);
      try {
        await queryData(parsed.filter, 1, (parsed as any).sort);
      } finally {
        setLoading(false);
      }
    } else {
      // Show confirmation dialog before executing write op
      setPendingBulkOp(parsed);
    }
  };

  const executeBulkOp = async (op: ParsedQuery) => {
    if (op.operation === "find") return;
    setPendingBulkOp(null);
    setLoading(true);
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
        setQueryError(json.error || "Operation failed");
        return;
      }
      if (op.operation === "deleteOne" || op.operation === "deleteMany") {
        setBulkResult(`Deleted ${json.deletedCount} document${json.deletedCount !== 1 ? "s" : ""}`);
      } else {
        setBulkResult(`Matched ${json.matchedCount}, modified ${json.modifiedCount} document${json.modifiedCount !== 1 ? "s" : ""}`);
      }
      await fetchData(1);
    } finally {
      setLoading(false);
    }
  };

  const handleResetQuery = async () => {
    setRawQuery(defaultQueryTemplate());
    setRawSort("");
    setQueryError(null);
    await fetchData(1);
    setPage(1);
  };

  const inputCls = "px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-600 font-mono outline-none focus:border-gray-400";
  const selectCls = "px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-800 outline-none focus:border-gray-400";

  const startRow = (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
      {/* Content Header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-gray-200 flex-shrink-0">
        {/* Collection name + mode toggle */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[15px] font-medium text-gray-900">{collection}</div>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-gray-200 bg-gray-50">
            <button
              onClick={() => setQueryMode("filter")}
              className={`px-3 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                queryMode === "filter"
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Filter
            </button>
            <button
              onClick={() => {
                setQueryMode("query");
                if (!rawQuery) setRawQuery(defaultQueryTemplate());
              }}
              className={`px-3 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                queryMode === "query"
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Query
            </button>
          </div>
        </div>

        {/* ── Filter mode ── */}
        {queryMode === "filter" && (
          <div className="flex flex-col gap-1.5">
            {filters.map((filter, index) => {
              const isLast = index === filters.length - 1;
              return (
                <div key={index} className="flex flex-col gap-1.5">
                  {index > 0 && (
                    <div className="flex items-center gap-1.5 pl-0.5">
                      <div className="h-px w-3 bg-gray-200" />
                      <button
                        onClick={() => setFilterMode(m => m === "and" ? "or" : "and")}
                        className="text-[10px] font-bold px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700 cursor-pointer tracking-wider transition-colors"
                      >
                        {filterMode.toUpperCase()}
                      </button>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      className={`${inputCls} flex-[2]`}
                      placeholder="key"
                      value={filter.key}
                      onChange={(e) => updateFilter(index, "key", e.target.value)}
                    />
                    <select
                      className={selectCls}
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, "operator", e.target.value as Operator)}
                    >
                      <option value="is">IS</option>
                      <option value="regex">REGEX</option>
                      <option value="gt">GT</option>
                      <option value="lt">LT</option>
                    </select>
                    <input
                      className={`${inputCls} flex-[2]`}
                      placeholder="value"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, "value", e.target.value)}
                    />
                    {filters.length > 1 && (
                      <button
                        className="px-2 py-1.5 rounded-md border border-red-200 text-[12px] text-red-500 hover:bg-red-50 cursor-pointer"
                        onClick={() => setFilters(filters.filter((_, i) => i !== index))}
                      >
                        ✕
                      </button>
                    )}
                    {isLast && (
                      <>
                        <button
                          className="px-3 py-1.5 rounded-md border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
                          onClick={() => setFilters([...filters, { key: "", operator: "is", value: "" }])}
                        >
                          + Add
                        </button>
                        <button
                          disabled={loading}
                          className="px-4 py-1.5 rounded-md bg-[#111] text-white text-[12px] font-medium cursor-pointer hover:bg-[#333] disabled:opacity-50 whitespace-nowrap"
                          onClick={async () => {
                            setLoading(true);
                            try { await queryData(buildQuery(), 1); } finally { setLoading(false); }
                          }}
                        >
                          {loading ? "Running…" : "Run"}
                        </button>
                        {(userRole === "owner" || userRole === "admin") && (
                          <button
                            disabled={loading}
                            className="px-3 py-1.5 rounded-md border border-red-200 text-[12px] text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            onClick={() => setPendingBulkOp({ operation: "deleteMany", filter: buildQuery() })}
                          >
                            Delete All
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Query mode ── */}
        {queryMode === "query" && (
          <div className="flex flex-col gap-2">
            <textarea
              rows={3}
              spellCheck={false}
              className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-700 font-mono outline-none focus:border-gray-400 resize-y leading-[1.6]"
              value={rawQuery}
              onChange={(e) => { setRawQuery(e.target.value); setQueryError(null); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleRunRawQuery();
                }
              }}
            />

            {/* Error */}
            {queryError && (
              <p className="text-[11px] text-red-500 font-mono bg-red-50 border border-red-100 rounded px-2.5 py-1.5">
                {queryError}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                disabled={loading}
                onClick={handleRunRawQuery}
                className="px-4 py-1.5 rounded-md bg-[#111] text-white text-[12px] font-medium cursor-pointer hover:bg-[#333] disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Running…" : "Run"}
              </button>
              <button
                onClick={handleResetQuery}
                className="px-3 py-1.5 rounded-md border border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Reset
              </button>
              <span className="text-[10px] text-gray-400 ml-1">Ctrl+Enter to run · EJSON supported</span>
            </div>
          </div>
        )}
      </div>

      {/* View Tabs + doc count */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 flex-shrink-0">
        {canWrite && (
          <button
            className="px-3.5 py-1 rounded-md text-[12px] font-medium bg-[#111] text-white cursor-pointer"
            onClick={openNew}
          >
            New
          </button>
        )}
        <button
          className="px-3.5 py-1 rounded-md text-[12px] text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer"
          onClick={() => setIsJsonViewOpen(true)}
        >
          JSON
        </button>
        <span className="ml-auto text-[11px] text-gray-400">
          {total > 0 ? `${startRow}–${endRow} of ${total} documents` : `${total} documents`}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0 relative">
        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        )}
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
                  {i === 0 ? "#" : (
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
                  className={`group cursor-pointer ${isCtx ? "bg-[#111]" : "hover:bg-gray-50"}`}
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
                            ? "sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r border-gray-200 border-gray-100 text-right pr-2 w-9 text-[11px] text-gray-400 select-none"
                            : "border-gray-100 text-gray-800 group-hover:bg-gray-50"
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

      <DocumentContextMenu
        pos={menuPos}
        userRole={userRole}
        onDelete={async () => {
          await deleteDoc(getEjsonIdString(contextRow?._id));
          await fetchData();
        }}
        onView={() => setViewDoc(contextRow)}
        onUpdate={() => openEdit(contextRow)}
        onRefresh={fetchData}
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
