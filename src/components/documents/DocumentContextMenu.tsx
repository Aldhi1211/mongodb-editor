import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Loader2, Eye, Pencil, Plus, Trash2, RefreshCw } from "lucide-react"

export default function DocumentContextMenu({ pos, onDelete, onUpdate, onAdd, onView, onRefresh, onClose, userRole = "viewer" }: any) {
    const [loading, setLoading] = useState(false)

    if (!pos) return null

    const handleRefresh = async (e: Event) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onRefresh()
        } finally {
            setLoading(false)
            onClose()
        }
    }

    const MENU_W = 160 // w-40
    const MENU_H = userRole !== "viewer" ? 200 : 110
    const x = Math.min(pos.x, window.innerWidth - MENU_W - 8)
    const y = Math.min(pos.y, window.innerHeight - MENU_H - 8)

    return (
        <DropdownMenu
            open
            onOpenChange={(open) => {
                if (!open && !loading) onClose()
            }}
        >
            <DropdownMenuContent
                style={{ position: "fixed", left: Math.max(8, x), top: Math.max(8, y) }}
                className="w-40"
            >
                {userRole !== "viewer" && (
                    <DropdownMenuItem onClick={() => { onAdd?.(); onClose(); }} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add document
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { onView(); onClose(); }} className="flex items-center gap-2">
                    <Eye className="w-4 h-4" /> View
                </DropdownMenuItem>
                {userRole !== "viewer" && (
                    <DropdownMenuItem onClick={onUpdate} className="flex items-center gap-2">
                        <Pencil className="w-4 h-4" /> Update
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    onSelect={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {loading ? "Refreshing..." : "Refresh"}
                </DropdownMenuItem>
                {userRole !== "viewer" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 text-red-600 focus:text-red-600">
                            <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
