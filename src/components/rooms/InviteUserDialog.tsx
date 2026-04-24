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
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleClose = () => {
        setEmail('')
        setRole('viewer')
        setError(null)
        onClose()
    }

    const sendInvite = async () => {
        if (!roomId) return
        const trimmedEmail = email.trim()
        if (!trimmedEmail) { setError('Email is required'); return }

        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/rooms/${roomId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ email: trimmedEmail, role })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            onResult('success', 'Invitation sent successfully')
            handleClose()
        } catch (e: any) {
            setError(e.message || 'Invite failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent onCloseAutoFocus={() => { document.body.style.pointerEvents = 'auto' }}>
                <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <Input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        onKeyDown={e => e.key === 'Enter' && sendInvite()}
                    />
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                    </Select>

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    <Button className="w-full" onClick={sendInvite} disabled={loading}>
                        {loading ? 'Sending…' : 'Send Invite'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
