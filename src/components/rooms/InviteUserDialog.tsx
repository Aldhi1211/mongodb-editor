'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

type Lookup =
    | { state: 'idle' }
    | { state: 'checking' }
    | { state: 'found'; email: string }
    | { state: 'self' }
    | { state: 'member' }
    | { state: 'notfound' }
    | { state: 'error'; message: string }

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
    const [lookup, setLookup] = useState<Lookup>({ state: 'idle' })

    const handleClose = () => {
        setEmail('')
        setRole('viewer')
        setError(null)
        setLookup({ state: 'idle' })
        onClose()
    }

    // GitHub-style debounced lookup: confirm whether a user with this email
    // exists (and whether they can be invited) before sending.
    useEffect(() => {
        const trimmed = email.trim()
        if (!roomId || !trimmed) {
            setLookup({ state: 'idle' })
            return
        }

        setLookup({ state: 'checking' })
        const ctrl = new AbortController()
        const t = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/rooms/${roomId}/invite?email=${encodeURIComponent(trimmed)}`,
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                        signal: ctrl.signal,
                    },
                )
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Lookup failed')

                if (!data.exists) setLookup({ state: 'notfound' })
                else if (data.isSelf) setLookup({ state: 'self' })
                else if (data.alreadyMember) setLookup({ state: 'member' })
                else setLookup({ state: 'found', email: data.email })
            } catch (e: any) {
                if (e.name === 'AbortError') return
                setLookup({ state: 'error', message: e.message })
            }
        }, 400)

        return () => { clearTimeout(t); ctrl.abort() }
    }, [email, roomId])

    const canInvite = lookup.state === 'found'

    const sendInvite = async () => {
        if (!roomId) return
        const trimmedEmail = email.trim()
        if (!trimmedEmail) { setError('Email is required'); return }
        if (!canInvite) return

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
                    <div>
                        <Input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email"
                            onKeyDown={e => e.key === 'Enter' && sendInvite()}
                        />
                        <LookupStatus lookup={lookup} />
                    </div>

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

                    <Button className="w-full" onClick={sendInvite} disabled={loading || !canInvite}>
                        {loading ? 'Sending…' : 'Send Invite'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function LookupStatus({ lookup }: { lookup: Lookup }) {
    if (lookup.state === 'idle') return null

    const base = 'flex items-center gap-1.5 text-xs mt-1.5'
    switch (lookup.state) {
        case 'checking':
            return (
                <p className={`${base} text-gray-400`}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
                </p>
            )
        case 'found':
            return (
                <p className={`${base} text-green-600`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {lookup.email} found — ready to invite
                </p>
            )
        case 'self':
            return (
                <p className={`${base} text-amber-600`}>
                    <XCircle className="w-3.5 h-3.5" /> This is you
                </p>
            )
        case 'member':
            return (
                <p className={`${base} text-amber-600`}>
                    <XCircle className="w-3.5 h-3.5" /> Already a member of this cluster
                </p>
            )
        case 'notfound':
            return (
                <p className={`${base} text-red-500`}>
                    <XCircle className="w-3.5 h-3.5" /> No user found with this email
                </p>
            )
        case 'error':
            return (
                <p className={`${base} text-red-500`}>
                    <XCircle className="w-3.5 h-3.5" /> {lookup.message}
                </p>
            )
    }
}
