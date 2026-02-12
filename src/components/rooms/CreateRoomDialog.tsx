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
    authDb: 'admin'
}

export default function CreateRoomDialog({
    open,
    onClose,
    onCreated
}: {
    open: boolean
    onClose: () => void
    onCreated: () => void
}) {
    const [name, setName] = useState('')
    const [mongo, setMongo] = useState<MongoConfig>(defaultConfig)

    const createRoom = async () => {
        if (!mongo.database) return

        await fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name,
                mongoUri: buildMongoUri(mongo)
            })
        })

        onClose()
        onCreated()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Room</DialogTitle>
                </DialogHeader>

                <Input placeholder="Room Name" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="Host" value={mongo.host} onChange={e => setMongo(v => ({ ...v, host: e.target.value }))} />
                <Input placeholder="Port" value={mongo.port} onChange={e => setMongo(v => ({ ...v, port: e.target.value }))} />
                <Input placeholder="Database" value={mongo.database} onChange={e => setMongo(v => ({ ...v, database: e.target.value }))} />
                <Input placeholder="Username" value={mongo.username} onChange={e => setMongo(v => ({ ...v, username: e.target.value }))} />
                <Input type="password" placeholder="Password" value={mongo.password} onChange={e => setMongo(v => ({ ...v, password: e.target.value }))} />
                <Input placeholder="Auth DB" value={mongo.authDb} onChange={e => setMongo(v => ({ ...v, authDb: e.target.value }))} />

                <Button className="w-full" onClick={createRoom}>Create</Button>
            </DialogContent>
        </Dialog>
    )
}
