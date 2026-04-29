'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import AuditDiffModal from '@/components/AuditDiffModal'

export default function AuditViewer({ onReady }: { onReady?: () => void }) {
    const [logs, setLogs] = useState<any[]>([])
    const [selectedLog, setSelectedLog] = useState<any | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const fetchLogs = (p: number) => {
        fetch(`/api/audit?page=${p}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(r => r.json())
            .then(res => {
                setLogs(res.data || [])
                setTotalPages(res.totalPages || 1)
                setTotal(res.total || 0)
                onReady?.()
            })
            .catch(() => onReady?.())
    }

    useEffect(() => { fetchLogs(page) }, [page])

    return (
        <div className="p-4">
            <h2 className="font-semibold mb-2">Audit Log</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Room ID</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Collection</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map(log => (
                        <TableRow
                            key={log._id}
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => setSelectedLog(log)}
                        >
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{log.userId}</TableCell>
                            <TableCell>{log.action}</TableCell>
                            <TableCell>{log.roomId}</TableCell>
                            <TableCell>{log.roomName}</TableCell>
                            <TableCell>{log.collection}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                    Total {total} log · Halaman {page} dari {totalPages}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        Sebelumnya
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        Berikutnya
                    </Button>
                </div>
            </div>

            {selectedLog && (
                <AuditDiffModal
                    open={true}
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                    onRollbackSuccess={() => { setSelectedLog(null); fetchLogs(page); }}
                />
            )}
        </div>
    )
}
