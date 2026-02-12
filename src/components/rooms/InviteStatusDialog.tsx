'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function InviteStatusDialog({
    status,
    onClose
}: {
    status: { type: 'success' | 'error'; msg: string } | null
    onClose: () => void
}) {
    useEffect(() => {
        if (status) {
            document.body.style.pointerEvents = 'none'
        } else {
            document.body.style.pointerEvents = 'auto'
        }

        return () => {
            document.body.style.pointerEvents = 'auto'
        }
    }, [status])

    if (!status) return null

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {status.type === 'success' ? 'Success' : 'Error'}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-2 text-sm">
                    {status.msg}
                </div>

                <Button className="w-full" onClick={onClose}>
                    OK
                </Button>
            </DialogContent>
        </Dialog>
    )
}
