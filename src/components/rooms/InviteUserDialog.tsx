'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useState } from 'react'

export default function InviteUserDialog({
    roomId,
    open,
    onClose,
    onResult
}: {
    roomId: string | null
    open: boolean
    onClose: () => void
    onResult: (status: 'success' | 'error', message: string) => void
}) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('viewer')

    const sendInvite = async () => {
        if (!roomId) return

        try {
            const res = await fetch(`/api/rooms/${roomId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ email, role })
            })

            if (!res.ok) throw new Error((await res.json()).error)

            onResult('success', 'Invitation sent successfully')
        } catch (e: any) {
            onResult('error', e.message || 'Invite failed')
        } finally {
            onClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                </DialogHeader>

                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                </Select>

                <Button className="w-full" onClick={sendInvite}>Send</Button>
            </DialogContent>
        </Dialog>
    )
}
