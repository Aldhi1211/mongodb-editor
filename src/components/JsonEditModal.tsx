'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Editor from '@monaco-editor/react'
import { parseShellStringToEjson, toShellString } from '@/lib/ejsonShell'

export default function JsonEditModal({
    open,
    onClose,
    document,
    onSave,
    isNew
}: {
    open: boolean
    onClose: () => void
    document: any
    onSave: (value: any) => Promise<void>
    isNew: boolean
}) {
    const [value, setValue] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const normalizeId = (id: any) => {
        if (id === undefined) return undefined
        try {
            return JSON.stringify(id)
        } catch {
            return JSON.stringify(id)
        }
    }

    // Sync editor when document changes
    useEffect(() => {
        setValue(toShellString(document))
        setError(null)
    }, [document, open])

    const handleSave = async () => {
        let parsed: any

        try {
            parsed = parseShellStringToEjson(value)
        } catch {
            setError('Invalid BSON/Extended JSON/Shell format')
            return
        }

        // Protect _id on edit
        const originalId = normalizeId(document?._id)
        const parsedId = normalizeId(parsed?._id)
        if (!isNew && originalId && parsedId && parsedId !== originalId) {
            setError('_id cannot be modified')
            return
        }

        try {
            setSaving(true)
            await onSave(parsed)
            onClose()
        } catch (e) {
            setError('Failed to save document')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="!max-w-none" style={{ width: '95vw', height: '90vh' }}>
                <DialogHeader>
                    <DialogTitle>{isNew ? 'Create Document' : 'Edit Document'}</DialogTitle>
                </DialogHeader>

                <div className="h-full border">
                    <Editor
                        height="60vh"
                        defaultLanguage="javascript"
                        value={value}
                        onChange={(v) => setValue(v || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            automaticLayout: true
                        }}
                    />
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="cursor-pointer disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
