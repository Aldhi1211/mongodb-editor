'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

type Collection = {
    name: string
    type: 'collection' | 'view' | 'timeseries' | string
}

type Props = {
    roomId: string
    onSelect: (name: string) => void
    activeCollection: string | null
    userRole?: string
}

export default function CollectionList({ roomId, onSelect, activeCollection, userRole = "viewer" }: Props) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [deleteCol, setDeleteCol] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    const loadCollections = async () => {
        try {
            const res = await fetch(`/api/rooms/${roomId}/collections`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await res.json()
            setCollections(Array.isArray(data) ? data : [])
        } catch {
            setCollections([])
        }
    }

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/rooms/${roomId}/collections`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                const data = await res.json()
                if (!cancelled) setCollections(Array.isArray(data) ? data : [])
            } catch {
                if (!cancelled) setCollections([])
            } finally {
                if (!cancelled) setLoading(false)
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
        <>
        <div className="w-[210px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 h-[41px] border-b border-gray-200 flex-shrink-0">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.05em]">Collections</span>
                <button
                    onClick={async () => {
                        setLoading(true)
                        try { await loadCollections() } finally { setLoading(false) }
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Search */}
            <div className="px-2.5 py-2 border-b border-gray-200 flex-shrink-0">
                <input
                    placeholder="Search collection..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-2 py-1 rounded-md border border-gray-200 bg-gray-50 text-[12px] text-gray-700 outline-none focus:border-gray-400"
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    </div>
                )}
                {!loading && filtered.map(col => {
                    const active = col.name === activeCollection
                    return (
                        <div
                            key={col.name}
                            className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 cursor-pointer
                                ${active ? 'bg-[#111]' : 'hover:bg-gray-50'}`}
                            onClick={() => onSelect(col.name)}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className={`text-[12px] font-mono truncate flex-1 ${active ? 'text-white' : 'text-gray-800'}`}>
                                        {col.name}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-mono text-[11px]">
                                    {col.name}
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={`text-[14px] leading-none px-0.5 cursor-pointer ${active ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        ⋯
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {userRole !== "viewer" ? (
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteCol(col.name)
                                            }}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem disabled className="text-gray-400 text-xs">
                                            No actions available
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )
                })}
            </div>
        </div>

        <ConfirmDialog
            open={!!deleteCol}
            onClose={() => setDeleteCol(null)}
            title="Hapus Collection"
            message={`Yakin ingin menghapus collection "${deleteCol}"? Tindakan ini tidak dapat dibatalkan.`}
            confirmLabel="Hapus"
            loading={deleting}
            onConfirm={async () => {
                if (!deleteCol) return
                setDeleting(true)
                try {
                    await fetch(
                        `/api/rooms/${roomId}/collections/${encodeURIComponent(deleteCol)}`,
                        { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                    )
                    setDeleteCol(null)
                    await loadCollections()
                } finally {
                    setDeleting(false)
                }
            }}
        />
        </>
    )
}
