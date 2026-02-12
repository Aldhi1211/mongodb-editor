'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AuditDiffModal from '@/components/AuditDiffModal'

export default function AuditViewer() {
    const [logs, setLogs] = useState<any[]>([])
    const [selectedLog, setSelectedLog] = useState<any | null>(null)

    useEffect(() => {
        fetch('/api/audit', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(r => r.json())
            .then(res => setLogs(res.data || []))
    }, [])

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
                    {logs.map(log => {
                        console.log(log.timestamp, typeof log.timestamp)
                        return (
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
                        )
                    })}
                </TableBody>
            </Table>
            {selectedLog && (
                <AuditDiffModal
                    open={true}
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}

        </div>
    )
}
