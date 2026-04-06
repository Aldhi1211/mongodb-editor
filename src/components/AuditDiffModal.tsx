'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Editor from '@monaco-editor/react'
import { EJSON } from 'bson'

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
    log
}: {
    open: boolean
    onClose: () => void
    log: any
}) {
    const [beforeValue, setBeforeValue] = useState('')
    const [afterValue, setAfterValue] = useState('')

    useEffect(() => {
        if (!log) return
        setBeforeValue(toFormattedJson(log.before))
        setAfterValue(toFormattedJson(log.after))
    }, [log, open])

    if (!log) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="!max-w-none"
                style={{ width: '95vw', height: '90vh' }}
            >
                <DialogHeader>
                    <DialogTitle>Audit Diff</DialogTitle>
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
