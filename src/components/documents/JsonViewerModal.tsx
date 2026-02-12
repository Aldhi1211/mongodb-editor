import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Editor from "@monaco-editor/react"
import { toShellString } from "@/lib/ejsonShell"

export default function JsonViewerModal({ open, onClose, data }: any) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="!max-w-none" style={{ width: "95vw", height: "90vh" }}>
                <DialogHeader>
                    <DialogTitle>Raw JSON Structure</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto border rounded p-2 text-sm font-mono bg-muted">
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        value={toShellString(data)}
                        options={{ readOnly: true, minimap: { enabled: false }, wordWrap: "on" }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
