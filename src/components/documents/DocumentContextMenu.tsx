import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Loader2 } from "lucide-react"

export default function DocumentContextMenu({ pos, onDelete, onUpdate, onRefresh, onClose }: any) {
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
                <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
                <DropdownMenuItem onClick={onUpdate}>Update</DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Refreshing..." : "Refresh"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
