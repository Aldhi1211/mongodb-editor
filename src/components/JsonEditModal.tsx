"use client";

import { useEffect, useState } from "react";
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

  function getIdValue(id: any): string | null {
    if (!id) return null;

    // Kalau ObjectId instance
    if (id instanceof ObjectId) {
      return id.toHexString();
    }

    // Kalau Extended JSON
    if (id.$oid) {
      return id.$oid;
    }

    return null;
  }

  const normalizeId = (id: any) => {
    if (id === undefined) return undefined;
    try {
      return JSON.stringify(id);
    } catch {
      return JSON.stringify(id);
    }
  };

  // Sync editor when document changes
  useEffect(() => {
    try {
      const raw = EJSON.stringify(document);
      const formatted = JSON.stringify(JSON.parse(raw), null, 2);
      setValue(formatted);
      setError(null);
    } catch {
      setValue("{}");
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

    // Protect _id
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-none"
        style={{ width: "95vw", height: "90vh" }}
      >
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Create Document" : "Edit Document"}
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
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
