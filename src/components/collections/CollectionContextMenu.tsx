import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Trash2, RefreshCw, Copy } from "lucide-react"

type Props = {
    pos: { x: number; y: number } | null
    collectionName: string
    userRole?: string
    onDelete: () => void
    onRefresh: () => void
    onClose: () => void
}

export default function CollectionContextMenu({ pos, collectionName, userRole = "viewer", onDelete, onRefresh, onClose }: Props) {
    if (!pos) return null

    const handleCopy = () => {
        navigator.clipboard.writeText(collectionName)
        onClose()
    }

    return (
        <DropdownMenu open onOpenChange={(open) => { if (!open) onClose() }}>
            <DropdownMenuContent
                style={{ position: "fixed", left: pos.x, top: pos.y }}
                className="w-44"
            >
                <DropdownMenuItem onClick={handleCopy} className="flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Copy name
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => { onRefresh(); onClose() }} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </DropdownMenuItem>

                {userRole !== "viewer" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => { onDelete(); onClose() }}
                            className="flex items-center gap-2 text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
