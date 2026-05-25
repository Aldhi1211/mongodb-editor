'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCcw, AlertTriangle, Loader2 } from 'lucide-react'
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

// ── Inline input dialog ────────────────────────────────────────────────────
function InputDialog({
    title,
    label,
    defaultValue = '',
    placeholder,
    confirmLabel,
    loading,
    error,
    onConfirm,
    onClose,
}: {
    title: string
    label: string
    defaultValue?: string
    placeholder?: string
    confirmLabel: string
    loading: boolean
    error: string
    onConfirm: (value: string) => void
    onClose: () => void
}) {
    const [value, setValue] = useState(defaultValue)

    useEffect(() => { setValue(defaultValue) }, [defaultValue])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white border border-gray-200 rounded-xl w-80 shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-[13px] font-semibold text-gray-800">{title}</p>
                </div>
                <div className="px-4 py-3 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-500">{label}</label>
                        <input
                            autoFocus
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onConfirm(value); if (e.key === 'Escape') onClose() }}
                            placeholder={placeholder}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[13px] text-gray-800 outline-none focus:border-gray-400"
                        />
                    </div>
                    {error && <p className="text-[11px] text-red-500">{error}</p>}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(value)}
                        disabled={loading || !value.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-gray-900 hover:bg-gray-700 text-white disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CollectionList({ roomId, onSelect, activeCollection, userRole = "viewer" }: Props) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // context menu
    const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
    const [menuCol, setMenuCol] = useState<string>('')

    // delete
    const [deleteCol, setDeleteCol] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    // add dialog
    const [showAdd, setShowAdd] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const [addError, setAddError] = useState('')

    // rename dialog
    const [renameCol, setRenameCol] = useState<string | null>(null)
    const [renameLoading, setRenameLoading] = useState(false)
    const [renameError, setRenameError] = useState('')

    // clone dialog
    const [cloneCol, setCloneCol] = useState<string | null>(null)
    const [cloneLoading, setCloneLoading] = useState(false)
    const [cloneError, setCloneError] = useState('')

    // collections that have a saved draft
    const [draftSet, setDraftSet] = useState<Set<string>>(new Set())

    useEffect(() => {
        const addPrefix = `mongoedit:draft:${roomId}:`
        const editPrefix = `mongoedit:editdraft:${roomId}:`

        const scan = () => {
            const s = new Set<string>()
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (!key) continue
                if (key.startsWith(addPrefix)) {
                    s.add(key.slice(addPrefix.length))
                } else if (key.startsWith(editPrefix)) {
                    try {
                        const raw = localStorage.getItem(key)
                        if (raw) {
                            const data = JSON.parse(raw)
                            if (data.collection) s.add(data.collection)
                        }
                    } catch { /* skip */ }
                }
            }
            return s
        }

        setDraftSet(scan())

        const update = () => setDraftSet(scan())
        window.addEventListener('mongoedit:saved', update)
        return () => window.removeEventListener('mongoedit:saved', update)
    }, [roomId])

    const token = () => localStorage.getItem('token')
    const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` })

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

    // ── handlers ──
    const handleAdd = async (name: string) => {
        setAddLoading(true)
        setAddError('')
        try {
            const res = await fetch(`/api/rooms/${roomId}/collections`, {
                method: 'POST', headers: authHeader(), body: JSON.stringify({ name: name.trim() })
            })
            const json = await res.json()
            if (!res.ok) { setAddError(json.error || 'Failed to create collection'); return }
            setShowAdd(false)
            await loadCollections()
        } catch {
            setAddError('Network error. Please try again.')
        } finally {
            setAddLoading(false)
        }
    }

    const handleRename = async (newName: string) => {
        if (!renameCol) return
        setRenameLoading(true)
        setRenameError('')
        try {
            const res = await fetch(`/api/rooms/${roomId}/collections/${encodeURIComponent(renameCol)}`, {
                method: 'PATCH', headers: authHeader(), body: JSON.stringify({ newName: newName.trim() })
            })
            const json = await res.json()
            if (!res.ok) { setRenameError(json.error || 'Failed to rename'); return }
            setRenameCol(null)
            await loadCollections()
        } catch {
            setRenameError('Network error. Please try again.')
        } finally {
            setRenameLoading(false)
        }
    }

    const handleClone = async (targetName: string) => {
        if (!cloneCol) return
        setCloneLoading(true)
        setCloneError('')
        try {
            const res = await fetch(`/api/rooms/${roomId}/collections/${encodeURIComponent(cloneCol)}/clone`, {
                method: 'POST', headers: authHeader(), body: JSON.stringify({ targetName: targetName.trim() })
            })
            const json = await res.json()
            if (!res.ok) { setCloneError(json.error || 'Failed to clone'); return }
            setCloneCol(null)
            await loadCollections()
        } catch {
            setCloneError('Network error. Please try again.')
        } finally {
            setCloneLoading(false)
        }
    }

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
                <button onClick={loadCollections} disabled={loading} className="text-gray-400 hover:text-gray-600 cursor-pointer">
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
                        <button onClick={loadCollections} className="mt-2 w-full text-[10px] text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded px-2 py-1 cursor-pointer transition-colors">
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
                            onContextMenu={e => {
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
                            {draftSet.has(col.name) && (
                                <span
                                    className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"
                                    title="Ada draft tersimpan"
                                />
                            )}
                        </div>
                    )
                })}

                {!loading && !error && filtered.length === 0 && collections.length > 0 && (
                    <p className="text-[11px] text-gray-400 text-center py-6">No match</p>
                )}
            </div>
        </div>

        {/* Context menu */}
        <CollectionContextMenu
            pos={menuPos}
            collectionName={menuCol}
            userRole={userRole}
            onDelete={() => setDeleteCol(menuCol)}
            onRefresh={loadCollections}
            onClose={() => { setMenuPos(null); setMenuCol('') }}
            onAdd={() => { setAddError(''); setShowAdd(true) }}
            onRename={() => { setRenameError(''); setRenameCol(menuCol) }}
            onClone={() => { setCloneError(''); setCloneCol(menuCol) }}
        />

        {/* Delete confirm */}
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
                    await fetch(`/api/rooms/${roomId}/collections/${encodeURIComponent(deleteCol)}`, {
                        method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
                    })
                    setDeleteCol(null)
                    await loadCollections()
                } finally {
                    setDeleting(false)
                }
            }}
        />

        {/* Add dialog */}
        {showAdd && (
            <InputDialog
                title="Add Collection"
                label="Collection name"
                placeholder="e.g. users"
                confirmLabel="Create"
                loading={addLoading}
                error={addError}
                onConfirm={handleAdd}
                onClose={() => { setShowAdd(false); setAddError('') }}
            />
        )}

        {/* Rename dialog */}
        {renameCol && (
            <InputDialog
                title="Edit Collection Name"
                label="New name"
                defaultValue={renameCol}
                placeholder="New collection name"
                confirmLabel="Rename"
                loading={renameLoading}
                error={renameError}
                onConfirm={handleRename}
                onClose={() => { setRenameCol(null); setRenameError('') }}
            />
        )}

        {/* Clone dialog */}
        {cloneCol && (
            <InputDialog
                title={`Clone "${cloneCol}"`}
                label="Clone name"
                defaultValue={`${cloneCol}_copy`}
                placeholder="Target collection name"
                confirmLabel="Clone"
                loading={cloneLoading}
                error={cloneError}
                onConfirm={handleClone}
                onClose={() => { setCloneCol(null); setCloneError('') }}
            />
        )}
        </>
    )
}
