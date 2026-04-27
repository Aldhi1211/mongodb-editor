'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Editor from '@monaco-editor/react'
import { EJSON } from 'bson'
import { RotateCcw } from 'lucide-react'

function toFormattedJson(data: any): string {
    try {
        const raw = EJSON.stringify(data ?? {})
        return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
        return '{}'
    }
}

export default function AuditDiffModal({
    open,
    onClose,
    log,
    onRollbackSuccess,
}: {
    open: boolean
    onClose: () => void
    log: any
    onRollbackSuccess?: () => void
}) {
    const [beforeValue, setBeforeValue] = useState('')
    const [afterValue, setAfterValue] = useState('')
    const [confirming, setConfirming] = useState(false)
    const [rolling, setRolling] = useState(false)
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

    useEffect(() => {
        if (!log) return
        setBeforeValue(toFormattedJson(log.before))
        setAfterValue(toFormattedJson(log.after))
        setConfirming(false)
        setResult(null)
    }, [log, open])

    if (!log) return null

    const canRollback = !!log.before && log.action !== 'rollback'
    const logId = typeof log._id === 'object' ? log._id?.$oid ?? String(log._id) : String(log._id)

    const handleRollback = async () => {
        setRolling(true)
        setResult(null)
        try {
            const res = await fetch(`/api/audit/${logId}/rollback`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setResult({ ok: true, msg: 'Document berhasil di-rollback.' })
            setConfirming(false)
            onRollbackSuccess?.()
        } catch (e: any) {
            setResult({ ok: false, msg: e.message || 'Rollback gagal.' })
        } finally {
            setRolling(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="!max-w-none"
                style={{ width: '95vw', height: '90vh' }}
            >
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle>
                            Audit Diff
                            <span className="ml-2 text-[11px] font-normal text-gray-400 capitalize">
                                ({log.action})
                            </span>
                        </DialogTitle>

                        {canRollback && !result?.ok && (
                            <div className="flex items-center gap-2">
                                {confirming ? (
                                    <>
                                        <span className="text-[12px] text-gray-600">Rollback ke versi Before?</span>
                                        <button
                                            onClick={handleRollback}
                                            disabled={rolling}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-medium cursor-pointer disabled:opacity-50 transition-colors"
                                        >
                                            {rolling ? (
                                                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            )}
                                            {rolling ? 'Rolling back…' : 'Ya, Rollback'}
                                        </button>
                                        <button
                                            onClick={() => setConfirming(false)}
                                            disabled={rolling}
                                            className="px-3 py-1.5 rounded-md border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                                        >
                                            Batal
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setConfirming(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-[12px] font-medium cursor-pointer transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Rollback
                                    </button>
                                )}
                            </div>
                        )}

                        {result && (
                            <span className={`text-[12px] font-medium ${result.ok ? 'text-green-600' : 'text-red-500'}`}>
                                {result.msg}
                            </span>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex gap-2 flex-1 overflow-hidden" style={{ height: '75vh' }}>
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="text-xs font-semibold text-red-600 mb-1 px-1">Before</div>
                        <div className="flex-1 border rounded overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="json"
                                value={beforeValue}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="text-xs font-semibold text-green-600 mb-1 px-1">After</div>
                        <div className="flex-1 border rounded overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="json"
                                value={afterValue}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
