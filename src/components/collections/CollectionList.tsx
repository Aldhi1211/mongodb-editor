'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCcw, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import CollectionContextMenu from "./CollectionContextMenu"

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

function friendlyError(raw: string): string {
    if (raw.includes('wire version') || raw.includes('4.2') || raw.includes('3.6'))
        return 'MongoDB version is not supported. Please upgrade to MongoDB 3.6 or newer.'
    if (raw.includes('ECONNREFUSED') || raw.includes('connect'))
        return 'Unable to connect to the database. Please check the connection URI.'
    if (raw.includes('Authentication') || raw.includes('auth'))
        return 'Authentication failed. Please check your credentials.'
    if (raw.includes('Network') || raw.includes('network'))
        return 'Network error. Please check your internet connection.'
    return 'Could not load collections. Please try again.'
}

async function fetchCollections(roomId: string): Promise<{ data: Collection[]; error: string | null }> {
    const res = await fetch(`/api/rooms/${roomId}/collections`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const json = await res.json()
    if (!res.ok || json.error) {
        return { data: [], error: friendlyError(json.error || '') }
    }
    return { data: Array.isArray(json) ? json : [], error: null }
}

export default function CollectionList({ roomId, onSelect, activeCollection, userRole = "viewer" }: Props) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deleteCol, setDeleteCol] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
    const [menuCol, setMenuCol] = useState<string>('')

    const loadCollections = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: err } = await fetchCollections(roomId)
            setCollections(data)
            setError(err)
        } catch {
            setError('Network error. Please check your internet connection.')
            setCollections([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const { data, error: err } = await fetchCollections(roomId)
                if (!cancelled) { setCollections(data); setError(err) }
            } catch {
                if (!cancelled) {
                    setError('Network error. Please check your internet connection.')
                    setCollections([])
                }
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
                    onClick={loadCollections}
                    disabled={loading}
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

                {!loading && error && (
                    <div className="mx-2.5 mt-3 p-2.5 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-red-500 leading-snug">{error}</p>
                        </div>
                        <button
                            onClick={loadCollections}
                            className="mt-2 w-full text-[10px] text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded px-2 py-1 cursor-pointer transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && filtered.map(col => {
                    const active = col.name === activeCollection
                    return (
                        <div
                            key={col.name}
                            className={`flex items-center px-3 py-2 border-b border-gray-100 cursor-pointer select-none transition-colors
                                ${active ? 'bg-[#111]' : menuCol === col.name && menuPos ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'hover:bg-gray-50'}`}
                            onClick={() => onSelect(col.name)}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                setMenuCol(col.name)
                                setMenuPos({ x: e.clientX, y: e.clientY })
                            }}
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
                        </div>
                    )
                })}

                {!loading && !error && filtered.length === 0 && collections.length > 0 && (
                    <p className="text-[11px] text-gray-400 text-center py-6">No match</p>
                )}
            </div>
        </div>

        <CollectionContextMenu
            pos={menuPos}
            collectionName={menuCol}
            userRole={userRole}
            onDelete={() => setDeleteCol(menuCol)}
            onRefresh={loadCollections}
            onClose={() => { setMenuPos(null); setMenuCol('') }}
        />

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
