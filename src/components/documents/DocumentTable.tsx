'use client'

import { useCallback, useMemo, useState } from "react"
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import JsonEditModal from "@/components/JsonEditModal"
import { useDocuments } from "./useDocuments"
import DocumentContextMenu from "./DocumentContextMenu"
import JsonViewerModal from "./JsonViewerModal"
import { getEjsonIdString, toShellString } from "@/lib/ejsonShell"

export default function DocumentTable({ roomId, collection }: any) {
    const { data, fetchData, queryData, createDoc, updateDoc, deleteDoc } =
        useDocuments(roomId, collection)

    const [selectedDoc, setSelectedDoc] = useState<any>(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [isJsonViewOpen, setIsJsonViewOpen] = useState(false)
    const [contextRow, setContextRow] = useState<any>(null)
    const [menuPos, setMenuPos] = useState<any>(null)
    const [query, setQuery] = useState('{}')
    const [loading, setLoading] = useState(false)

    const formatCellValue = useCallback((value: any) => {
        if (value === null || value === undefined) return ""
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return String(value)
        }

        const formatted = toShellString(value)
        if (formatted.includes("\n")) return JSON.stringify(value)
        return formatted
    }, [])

    const columns = useMemo<ColumnDef<any>[]>(() => {
        if (!data.length) return []
        return Object.keys(data[0]).map(key => ({
            accessorKey: key,
            header: key,
            cell: info => formatCellValue(info.getValue())
        }))
    }, [data, formatCellValue])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel()
    })

    const handleSave = async (payload: any) => {
        if (!selectedDoc) await createDoc(payload)
        else await updateDoc(getEjsonIdString(selectedDoc._id), payload)

        await fetchData()
        setIsEditorOpen(false)
        setSelectedDoc(null)
    }

    return (
        <Card className="flex-1 h-full">
            <CardContent className="p-3 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-semibold">{collection}</h2>

                    <input
                        className="border rounded px-2 py-1 text-sm w-64 font-mono"
                        placeholder='{"status":"active"}'
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <Button
                        size="sm"
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true)
                            try {
                                await queryData(query)
                            } catch {
                                alert("Invalid query JSON")
                            } finally {
                                setLoading(false)
                            }
                        }}
                    >
                        {loading ? "Query..." : "Run"}
                    </Button>

                    <Button onClick={() => { setSelectedDoc(null); setIsEditorOpen(true) }}>New</Button>
                    <Button variant="secondary" onClick={() => setIsJsonViewOpen(true)}>JSON</Button>
                </div>

                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(hg => (
                            <TableRow key={hg.id}>
                                {hg.headers.map(h => (
                                    <TableHead key={h.id}>
                                        {flexRender(h.column.columnDef.header, h.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.map(row => (
                            <TableRow
                                key={row.id}
                                className="cursor-pointer hover:bg-muted/60 transition-colors"
                                onClick={() => { setSelectedDoc(row.original); setIsEditorOpen(true) }}
                                onContextMenu={(e) => {
                                    e.preventDefault()
                                    setContextRow(row.original)
                                    setMenuPos({ x: e.clientX, y: e.clientY })
                                }}
                            >   
                                {row.getVisibleCells().map(cell => (
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
                    onDelete={async () => { await deleteDoc(getEjsonIdString(contextRow?._id)); await fetchData() }}
                    onUpdate={() => { setSelectedDoc(contextRow); setIsEditorOpen(true) }}
                    onRefresh={fetchData}
                    onClose={() => { setMenuPos(null); setContextRow(null) }}
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
    )
}
