'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { compare } from 'fast-json-patch'

export default function AuditDiffModal({
    open,
    onClose,
    log
}: {
    open: boolean
    onClose: () => void
    log: any
}) {
    if (!log) return null

    const patches = compare(log.before || {}, log.after || {})

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Audit Diff</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="space-y-2 text-sm font-mono">
                        {patches.map((p, i) => {
                            const isRemove = p.op === 'remove'
                            const isAdd = p.op === 'add'
                            const isReplace = p.op === 'replace'

                            return (
                                <div
                                    key={i}
                                    className={`p-2 rounded max-w-full overflow-hidden ${isAdd
                                        ? 'bg-green-100 text-green-800'
                                        : isRemove
                                            ? 'bg-red-100 text-red-800 line-through'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                >
                                    <div>
                                        <strong>{p.op.toUpperCase()}</strong> {p.path}
                                    </div>

                                    {isAdd || isReplace ? (
                                        <pre className="text-xs opacity-80 whitespace-pre-wrap break-all overflow-x-auto max-w-full">
                                            New: {JSON.stringify((p as any).value, null, 2)}
                                        </pre>
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
