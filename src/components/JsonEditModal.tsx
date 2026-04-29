"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import { EJSON } from "bson";
import { ObjectId } from "bson";

export default function JsonEditModal({
  open,
  onClose,
  document,
  onSave,
  isNew,
}: {
  open: boolean;
  onClose: () => void;
  document: any;
  onSave: (value: any) => Promise<void>;
  isNew: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const originalValue = useRef("");

  const isDirty = value !== originalValue.current;

  function getIdValue(id: any): string | null {
    if (!id) return null;
    if (id instanceof ObjectId) return id.toHexString();
    if (id.$oid) return id.$oid;
    return null;
  }

  useEffect(() => {
    try {
      const raw = EJSON.stringify(document);
      const formatted = JSON.stringify(JSON.parse(raw), null, 2);
      setValue(formatted);
      originalValue.current = formatted;
      setError(null);
    } catch {
      setValue("{}");
      originalValue.current = "{}";
    }
  }, [document, open]);

  const handleSave = async () => {
    setError(null);
    let parsed: any;
    try {
      parsed = EJSON.parse(value);
    } catch (err: any) {
      setError(err.message);
      return;
    }

    const originalId = getIdValue(document?._id);
    const parsedId = getIdValue(parsed?._id);
    if (!isNew && originalId && parsedId && parsedId !== originalId) {
      setError("_id cannot be modified");
      return;
    }

    try {
      setSaving(true);
      await onSave(parsed);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  };

  // Intercept Dialog's built-in close (X button / Esc / backdrop click)
  const handleOpenChange = (open: boolean) => {
    if (!open) handleCancel();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="!max-w-none"
          style={{ width: "95vw", height: "90vh" }}
        >
          <DialogHeader>
            <DialogTitle>
              {isNew ? "Create Document" : "Edit Document"}
              {isDirty && (
                <span className="ml-2 text-xs font-normal text-amber-500">● unsaved changes</span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="h-full border">
            <Editor
              height="60vh"
              defaultLanguage="json"
              value={value}
              onChange={(v) => setValue(v || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
              }}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Buang perubahan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Kamu punya perubahan yang belum disimpan. Yakin mau keluar tanpa menyimpan?
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="cursor-pointer"
            >
              Kembali Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                onClose();
              }}
              className="cursor-pointer"
            >
              Buang & Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
