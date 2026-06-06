'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCcw, ServerCrash, Loader2, Database } from 'lucide-react'
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import Breadcrumb from "@/components/Breadcrumb"
import CollectionContextMenu from "./CollectionContextMenu"

type Collection = {
    name: string
    type: 'collection' | 'view' | 'timeseries' | string
}

type Props = {
    roomId: string
    roomName?: string
    onSelect: (name: string) => void
    activeCollection: string | null
    userRole?: string
    /** Search query (controlled from the navbar search box). */
    search?: string
    /** Incrementing counter that opens the "Add collection" dialog (navbar button). */
    addSignal?: number
}

type ConnError = { title: string; message: string; hint?: string; raw?: string }

function friendlyError(raw: string): ConnError {
    const r = (raw || '').toLowerCase()

    if (r.includes('wire version') || r.includes('4.2') || r.includes('3.6'))
        return {
            title: 'Unsupported MongoDB version',
            message: 'This cluster runs a MongoDB version that is too old to use here.',
            hint: 'Upgrade the server to MongoDB 3.6 or newer.',
        }
    if (r.includes('bad auth') || r.includes('authentication') || r.includes('auth failed') || r.includes('credentials') || r.includes('unauthorized'))
        return {
            title: 'Authentication failed',
            message: 'The username or password for this cluster was rejected.',
            hint: 'Update the database user / password in the cluster connection URI.',
        }
    if (r.includes('not whitelist') || r.includes('not allowed') || r.includes('ip address') || r.includes('ip that isn'))
        return {
            title: 'IP address not allowed',
            message: "The server's IP is not on this cluster's access list.",
            hint: 'In MongoDB Atlas → Network Access, allow the server IP (or 0.0.0.0/0).',
        }
    if (r.includes('timed out') || r.includes('serverselection') || r.includes('etimedout') || r.includes('timeout'))
        return {
            title: "Can't reach the cluster",
            message: 'The connection timed out while trying to reach the database.',
            hint: 'Check that the cluster is online and that the server IP is allowed (Atlas: add 0.0.0.0/0 to Network Access).',
        }
    if (r.includes('enotfound') || r.includes('querysrv') || r.includes('eservfail') || r.includes('getaddrinfo') || r.includes('dns'))
        return {
            title: 'Cluster address not found',
            message: 'The database host name could not be resolved.',
            hint: 'Double-check the hostname in this cluster’s connection URI.',
        }
    if (r.includes('econnrefused') || r.includes('connect'))
        return {
            title: 'Connection refused',
            message: 'The database refused the connection.',
            hint: 'Verify the cluster is running and reachable from the server.',
        }
    return {
        title: 'Could not connect to the cluster',
        message: 'Something went wrong while loading collections from this cluster.',
        hint: 'Please try again in a moment.',
    }
}

async function fetchCollections(roomId: string): Promise<{ data: Collection[]; error: ConnError | null }> {
    const res = await fetch(`/api/rooms/${roomId}/collections`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const json = await res.json()
    if (!res.ok || json.error) {
        const raw = json.error || `Request failed (${res.status})`
        return { data: [], error: { ...friendlyError(raw), raw } }
    }
    return { data: Array.isArray(json) ? json : [], error: null }
}

// ── Inline input dialog ────────────────────────────────────────────────────
function InputDialog({
    title, label, defaultValue = '', placeholder, confirmLabel, loading, error, onConfirm, onClose,
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

// ── Main component (full-page) ───────────────────────────────────────────────
export default function CollectionList({ roomId, roomName, onSelect, activeCollection, userRole = "viewer", search = '', addSignal = 0 }: Props) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<ConnError | null>(null)

    const networkError: ConnError = {
        title: 'Network error',
        message: 'Could not reach the server.',
        hint: 'Check your internet connection and try again.',
    }

    // context menu
    const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
    const [menuCol, setMenuCol] = useState<string>('')

    // delete
    const [deleteCol, setDeleteCol] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    // add / rename / clone dialogs
    const [showAdd, setShowAdd] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const [addError, setAddError] = useState('')
    const [renameCol, setRenameCol] = useState<string | null>(null)
    const [renameLoading, setRenameLoading] = useState(false)
    const [renameError, setRenameError] = useState('')
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
            setError(networkError)
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
                    setError(networkError)
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

    // Open the "Add collection" dialog when the navbar button bumps addSignal.
    // Capture the value at mount so a remount with a persisted nonce doesn't re-open it.
    const initialAddSignal = useRef(addSignal)
    useEffect(() => {
        if (addSignal === initialAddSignal.current) return
        setAddError(''); setShowAdd(true)
    }, [addSignal])

    return (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
            {/* Sub-toolbar: breadcrumb (cluster) + count + refresh */}
            <Breadcrumb
                cluster={roomName || "Cluster"}
                right={
                    <>
                        <span className="font-mono text-[12px] text-neutral-400">
                            {filtered.length} collection{filtered.length !== 1 ? "s" : ""}
                        </span>
                        <button
                            onClick={loadCollections}
                            disabled={loading}
                            title="Refresh"
                            className="w-7 h-7 grid place-items-center rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </>
                }
            />

            {/* Body */}
            <div className="flex-1 overflow-y-auto relative">
                {loading && (
                    <>
                        <div className="mongo-progress-track text-neutral-900 sticky top-0 left-0 right-0 z-30" />
                        <div className="px-4 py-3">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                                    <div className="h-3 w-6 rounded bg-gray-100 flex-shrink-0" />
                                    <div className="h-3 rounded bg-gray-100" style={{ width: `${160 + (i % 5) * 60}px` }} />
                                    <div className="h-3 w-16 rounded bg-gray-100" />
                                    <div className="h-3 w-24 rounded bg-gray-100 hidden sm:block" />
                                    <div className="h-3 w-20 rounded bg-gray-100 hidden md:block ml-auto" />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {!loading && error && (
                    <div className="h-full flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 grid place-items-center mb-4">
                            <ServerCrash className="w-7 h-7 text-red-400" />
                        </div>
                        <p className="text-[15px] font-semibold text-gray-800">{error.title}</p>
                        <p className="text-[13px] text-gray-500 mt-1.5 max-w-sm leading-relaxed">{error.message}</p>
                        {error.hint && (
                            <p className="text-[12px] text-gray-400 mt-2 max-w-sm leading-relaxed">{error.hint}</p>
                        )}
                        <button
                            onClick={loadCollections}
                            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-neutral-900 hover:bg-neutral-700 text-white cursor-pointer transition-colors"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            Try again
                        </button>
                        {error.raw && (
                            <details className="mt-5 w-full max-w-md text-left">
                                <summary className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer text-center">Technical details</summary>
                                <pre className="mt-2 text-[11px] font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 overflow-auto max-h-32 whitespace-pre-wrap break-words">{error.raw}</pre>
                            </details>
                        )}
                    </div>
                )}

                {!loading && !error && (
                    <div className="divide-y divide-gray-100">
                        {filtered.map(col => {
                            const active = col.name === activeCollection
                            return (
                                <div
                                    key={col.name}
                                    className={`group flex items-center gap-3 border-l-2 px-4 sm:px-5 lg:px-6 py-3 cursor-pointer select-none transition-colors
                                        ${active
                                            ? 'bg-[#111] border-[#111]'
                                            : menuCol === col.name && menuPos
                                                ? 'bg-blue-50 border-blue-300'
                                                : 'border-transparent hover:bg-gray-100 hover:border-neutral-900'}`}
                                    onClick={() => onSelect(col.name)}
                                    onContextMenu={e => {
                                        e.preventDefault()
                                        setMenuCol(col.name)
                                        setMenuPos({ x: e.clientX, y: e.clientY })
                                    }}
                                >
                                    <div className={`w-8 h-8 rounded-lg grid place-items-center flex-shrink-0 transition-colors ${active ? 'bg-white/10' : 'bg-gray-100 border border-gray-200 group-hover:bg-white group-hover:border-gray-300'}`}>
                                        <Database className={`w-4 h-4 transition-colors ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'}`} />
                                    </div>
                                    <span className={`text-[13px] font-mono truncate flex-1 transition-colors ${active ? 'text-white' : 'text-gray-800 group-hover:text-gray-950'}`}>
                                        {col.name}
                                    </span>
                                    {draftSet.has(col.name) && (
                                        <span
                                            className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"
                                            title="Ada draft tersimpan"
                                        />
                                    )}
                                </div>
                            )
                        })}

                        {filtered.length === 0 && collections.length > 0 && (
                            <p className="text-[12px] text-gray-400 text-center py-12">No collection matches “{search}”</p>
                        )}
                        {collections.filter(c => c.type === 'collection').length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 grid place-items-center">
                                    <Database className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-[13px] text-gray-500">No collections in this cluster</p>
                            </div>
                        )}
                    </div>
                )}
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
        </div>
    )
}
