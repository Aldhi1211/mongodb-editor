import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Loader2, Eye, Pencil, Trash2, RefreshCw } from "lucide-react"

export default function DocumentContextMenu({ pos, onDelete, onUpdate, onView, onRefresh, onClose, userRole = "viewer" }: any) {
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

    return (
        <DropdownMenu
            open
            onOpenChange={(open) => {
                if (!open && !loading) onClose()
            }}
        >
            <DropdownMenuContent
                style={{ position: "fixed", left: pos.x, top: pos.y }}
                className="w-40"
            >
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
