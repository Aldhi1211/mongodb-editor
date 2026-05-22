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

  const inputCls = "px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-600 font-mono outline-none focus:border-gray-400";
  const selectCls = "px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-800 outline-none focus:border-gray-400";

  const startRow = (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
      {/* Content Header */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-200 flex-shrink-0">
        <div className="text-[15px] font-medium text-gray-900 mb-2.5">{collection}</div>

        {/* Filter rows */}
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
                  </>
                )}
              </div>
              </div>
            );
          })}
        </div>
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
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="group cursor-pointer hover:bg-gray-50"
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
                    className={`px-3.5 py-[7px] border-b border-r border-gray-100 whitespace-nowrap last:border-r-0 max-w-[260px] overflow-hidden text-ellipsis align-middle group-hover:bg-gray-50
                      ${i === 0 ? "sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r border-gray-200 text-right pr-2 w-9 text-[11px] text-gray-400 select-none" : "text-gray-800"}
                    `}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
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
    </div>
  );
}
