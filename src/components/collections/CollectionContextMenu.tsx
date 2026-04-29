import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Trash2, RefreshCw, Copy, CopyPlus, Pencil, FolderPlus } from "lucide-react"

type Props = {
    pos: { x: number; y: number } | null
    collectionName: string
    userRole?: string
    onDelete: () => void
    onRefresh: () => void
    onClose: () => void
    onClone: () => void
    onRename: () => void
    onAdd: () => void
}

export default function CollectionContextMenu({
    pos, collectionName, userRole = "viewer",
    onDelete, onRefresh, onClose,
    onClone, onRename, onAdd,
}: Props) {
    if (!pos) return null

    const handle = (fn: () => void) => () => { fn(); onClose() }

    return (
        <DropdownMenu open onOpenChange={(open) => { if (!open) onClose() }}>
            <DropdownMenuContent
                style={{ position: "fixed", left: pos.x, top: pos.y }}
                className="w-48"
            >
                <DropdownMenuItem onClick={handle(() => navigator.clipboard.writeText(collectionName))} className="flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Copy name
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handle(onRefresh)} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </DropdownMenuItem>

                {userRole !== "viewer" && (
                    <>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={handle(onAdd)} className="flex items-center gap-2">
                            <FolderPlus className="w-4 h-4" /> Add collection
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handle(onRename)} className="flex items-center gap-2">
                            <Pencil className="w-4 h-4" /> Edit name
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handle(onClone)} className="flex items-center gap-2">
                            <CopyPlus className="w-4 h-4" /> Clone
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={handle(onDelete)}
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
