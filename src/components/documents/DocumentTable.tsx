"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import JsonEditModal from "@/components/JsonEditModal";
import { useDocuments } from "./useDocuments";
import DocumentContextMenu from "./DocumentContextMenu";
import JsonViewerModal from "./JsonViewerModal";
import { getEjsonIdString, toShellString } from "@/lib/ejsonShell";

export default function DocumentTable({ roomId, collection }: any) {
  const { data, fetchData, queryData, createDoc, updateDoc, deleteDoc } =
    useDocuments(roomId, collection);

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isJsonViewOpen, setIsJsonViewOpen] = useState(false);
  const [contextRow, setContextRow] = useState<any>(null);
  const [menuPos, setMenuPos] = useState<any>(null);
  const [query, setQuery] = useState("{}");
  const [loading, setLoading] = useState(false);

  type Operator = "is" | "regex" | "gt" | "lt";

  type Filter = {
    key: string;
    operator: Operator;
    value: string;
  };

  const [filters, setFilters] = useState<Filter[]>([
    { key: "", operator: "is", value: "" },
  ]);

  const formatCellValue = useCallback((value: any) => {
    if (value === null || value === undefined) return "";
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    const formatted = toShellString(value);
    if (formatted.includes("\n")) return JSON.stringify(value);
    return formatted;
  }, []);

  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!data.length) return [];
    return Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => formatCellValue(info.getValue()),
    }));
  }, [data, formatCellValue]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSave = async (payload: any) => {
    if (!selectedDoc) await createDoc(payload);
    else await updateDoc(getEjsonIdString(selectedDoc._id), payload);

    await fetchData();
    setIsEditorOpen(false);
    setSelectedDoc(null);
  };

  const updateFilter = <K extends keyof Filter>(
    index: number,
    field: K,
    value: Filter[K],
  ) => {
    const newFilters = [...filters];

    newFilters[index][field] = value;

    setFilters(newFilters);
  };

  const buildQuery = () => {
    const query: any = {};

    filters.forEach((f) => {
      if (!f.key) return;

      const value = isNaN(Number(f.value)) ? f.value : Number(f.value);

      switch (f.operator) {
        case "is":
          query[f.key] = value;
          break;

        case "regex":
          query[f.key] = {
            $regex: f.value,
            $options: "i",
          };
          break;

        case "gt":
          query[f.key] = { $gt: value };
          break;

        case "lt":
          query[f.key] = { $lt: value };
          break;
      }
    });

    return query;
  };

  const addFilter = () => {
    setFilters([...filters, { key: "", operator: "is", value: "" }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  return (
    <Card className="flex-1 h-full">
      <CardContent className="p-3 h-full flex flex-col">
        <div className="mb-2 flex flex-col gap-2">
          {/* ROW 1 — Collections */}
          <h2 className="font-semibold">{collection}</h2>

          {/* ROW 2 — Query Bar */}
          <div className="text-xs text-muted-foreground">Query</div>
          <div className="flex flex-col gap-2">
            {/* FILTER LIST */}
            {filters.map((filter, index) => (
              <div className="flex flex-col gap-2">
                {filters.map((filter, index) => {
                  const isLast = index === filters.length - 1;

                  return (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        className="border px-2 py-1"
                        placeholder="key"
                        value={filter.key}
                        onChange={(e) =>
                          updateFilter(index, "key", e.target.value)
                        }
                      />

                      <select
                        className="border px-2 py-1"
                        value={filter.operator}
                        onChange={(e) =>
                          updateFilter(
                            index,
                            "operator",
                            e.target.value as Operator,
                          )
                        }
                      >
                        <option value="is">IS</option>
                        <option value="regex">REGEX</option>
                        <option value="gt">GREATER</option>
                        <option value="lt">LESS</option>
                      </select>

                      <input
                        className="border px-2 py-1"
                        placeholder="value"
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(index, "value", e.target.value)
                        }
                      />

                      <button
                        className="px-2 py-1 border rounded text-red-500"
                        onClick={() => removeFilter(index)}
                      >
                        ✕
                      </button>

                      {/* ONLY SHOW ON LAST ROW */}
                      {isLast && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={addFilter}
                          >
                            + Add
                          </Button>

                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={async () => {
                              setLoading(true);
                              try {
                                const mongoQuery = buildQuery();
                                await queryData(mongoQuery);
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            {loading ? "Query..." : "Run"}
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ROW 3 — Action Bar */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setSelectedDoc(null);
                setIsEditorOpen(true);
              }}
            >
              New
            </Button>

            <Button variant="secondary" onClick={() => setIsJsonViewOpen(true)}>
              JSON
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/60 transition-colors"
                onClick={() => {
                  setSelectedDoc(row.original);
                  setIsEditorOpen(true);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextRow(row.original);
                  setMenuPos({ x: e.clientX, y: e.clientY });
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <DocumentContextMenu
          pos={menuPos}
          onDelete={async () => {
            await deleteDoc(getEjsonIdString(contextRow?._id));
            await fetchData();
          }}
          onUpdate={() => {
            setSelectedDoc(contextRow);
            setIsEditorOpen(true);
          }}
          onRefresh={fetchData}
          onClose={() => {
            setMenuPos(null);
            setContextRow(null);
          }}
        />

        {isEditorOpen && (
          <JsonEditModal
            open
            document={selectedDoc || {}}
            isNew={!selectedDoc}
            onClose={() => setIsEditorOpen(false)}
            onSave={handleSave}
          />
        )}

        <JsonViewerModal
          open={isJsonViewOpen}
          onClose={setIsJsonViewOpen}
          data={data}
        />
      </CardContent>
    </Card>
  );
}
