'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoreVertical, RefreshCcw } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

type Collection = {
    name: string
    type: 'collection' | 'view' | 'timeseries' | string
}

type Props = {
    roomId: string
    onSelect: (name: string) => void
    activeCollection: string | null
}

export default function CollectionList({
    roomId,
    onSelect,
    activeCollection
}: Props) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const res = await fetch(`/api/rooms/${roomId}/collections`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                const data = await res.json()
                if (!cancelled) setCollections(Array.isArray(data) ? data : [])
            } catch {
                if (!cancelled) setCollections([])
            }
        }

        load()
        return () => { cancelled = true }
    }, [roomId])

    const filtered = useMemo<Collection[]>(() => {
        const q = search.toLowerCase()
        return collections
            .filter(c => c.type === 'collection')
            .filter(c => c.name.toLowerCase().includes(q))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [collections, search])

    return (
        <Card className="w-64 h-full rounded-none border-r">
            <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold">Collections</h2>

                    <Button
                        size="icon"
                        variant="ghost"
                        disabled={loading}
                        onClick={async () => {
                            try {
                                setLoading(true)
                                const res = await fetch(`/api/rooms/${roomId}/collections`, {
                                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                })
                                const data = await res.json()
                                setCollections(Array.isArray(data) ? data : [])
                            } finally {
                                setLoading(false)
                            }
                        }}
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <Input
                    placeholder="Search collection..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="mb-2"
                />

                <ScrollArea className="h-[calc(100vh-170px)]">
                    {filtered.map(col => {
                        const active = col.name === activeCollection

                        return (
                            <div key={col.name} className="flex items-center">
                                <Button
                                    variant="ghost"
                                    className={`flex-1 justify-start overflow-hidden ${active ? "bg-black text-white hover:bg-black hover:text-white font-semibold" : ""}`}
                                    onClick={() => onSelect(col.name)}
                                >
                                    <span className="max-w-[160px] truncate">
                                        {col.name}
                                    </span>
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={async () => {
                                                const ok = confirm(`Delete collection "${col.name}"? This cannot be undone.`)
                                                if (!ok) return

                                                await fetch(
                                                    `/api/rooms/${roomId}/collections/${encodeURIComponent(col.name)}`,
                                                    {
                                                        method: 'DELETE',
                                                        headers: {
                                                            Authorization: `Bearer ${localStorage.getItem('token')}`
                                                        }
                                                    }
                                                )

                                                // reload list
                                                const res = await fetch(`/api/rooms/${roomId}/collections`, {
                                                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                                })
                                                const data = await res.json()
                                                setCollections(Array.isArray(data) ? data : [])
                                            }}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )
                    })}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
