'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MongoConfig, buildMongoUri } from '@/lib/mongoUri'

const defaultConfig: MongoConfig = {
    host: '127.0.0.1',
    port: '27017',
    database: '',
    username: '',
    password: '',
    authDb: 'admin',
}

export default function CreateRoomDialog({
    open,
    onClose,
    onCreated,
}: {
    open: boolean
    onClose: () => void
    onCreated: () => void
}) {
    const [name, setName] = useState('')
    const [mongo, setMongo] = useState<MongoConfig>(defaultConfig)
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const reset = () => {
        setName('')
        setMongo(defaultConfig)
        setShowPass(false)
        setError(null)
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    const handleCreate = async () => {
        if (!mongo.database) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ name, mongoUri: buildMongoUri(mongo) }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            handleClose()
            onCreated()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent onCloseAutoFocus={() => { document.body.style.pointerEvents = 'auto' }}>
                <DialogHeader>
                    <DialogTitle>Add Room</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    {/* Room Name */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Room Name</label>
                        <Input
                            placeholder="Nama room"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    {/* MongoDB Connection */}
                    <div className="flex flex-col gap-2 border rounded-md p-3 bg-gray-50">
                        <p className="text-xs font-medium text-gray-500">Koneksi MongoDB</p>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Host</label>
                                <Input
                                    placeholder="127.0.0.1"
                                    value={mongo.host}
                                    onChange={e => setMongo(v => ({ ...v, host: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Port</label>
                                <Input
                                    placeholder="27017"
                                    value={mongo.port}
                                    onChange={e => setMongo(v => ({ ...v, port: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Database</label>
                            <Input
                                placeholder="mydb"
                                value={mongo.database}
                                onChange={e => setMongo(v => ({ ...v, database: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Username</label>
                                <Input
                                    placeholder="(opsional)"
                                    value={mongo.username}
                                    onChange={e => setMongo(v => ({ ...v, username: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="(opsional)"
                                        value={mongo.password}
                                        onChange={e => setMongo(v => ({ ...v, password: e.target.value }))}
                                        className="pr-9"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPass ? (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        ) : (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Auth DB</label>
                            <Input
                                placeholder="admin"
                                value={mongo.authDb}
                                onChange={e => setMongo(v => ({ ...v, authDb: e.target.value }))}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleClose} disabled={loading}>Batal</Button>
                        <Button onClick={handleCreate} disabled={loading || !mongo.database.trim()}>
                            {loading ? 'Membuat…' : 'Buat Room'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
