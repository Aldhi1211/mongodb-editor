"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { EJSON } from "bson";
import { ObjectId } from "bson";
import { Button } from "@/components/ui/button";

const DRAFT_KEY_PREFIX = "mongoedit:draft:";

export default function EditPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomId = searchParams.get("roomId") ?? "";
  const collection = searchParams.get("collection") ?? "";
  const isNew = searchParams.get("mode") === "new";

  const [value, setValue] = useState("{\n  \n}");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const valueRef = useRef(value);
  const originalDocRef = useRef<any>(null);
  const savedRef = useRef(false); // true after successful save — prevents cleanup from re-writing draft
  const draftKey = `${DRAFT_KEY_PREFIX}${roomId}:${collection}`;

  // Keep ref in sync with latest value (needed for closures in effects/cleanup)
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Initialize editor on mount
  useEffect(() => {
    if (isNew) {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        try {
          const draft = JSON.parse(raw);
          setValue(draft.value ?? "{\n  \n}");
          setDraftSavedAt(draft.savedAt ?? null);
          setDraftRestored(true);
        } catch {
          // corrupted draft, ignore and start fresh
        }
      }
    } else {
      // Edit mode: document passed via sessionStorage from DocumentTable
      const raw = sessionStorage.getItem("edit_doc");
      if (raw) {
        sessionStorage.removeItem("edit_doc");
        try {
          const doc = EJSON.parse(raw);
          originalDocRef.current = doc;
          const formatted = JSON.stringify(JSON.parse(EJSON.stringify(doc)), null, 2);
          setValue(formatted);
        } catch {
          setValue("{}");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save to localStorage (add mode only)
  useEffect(() => {
    if (!isNew) return;
    const t = setTimeout(() => {
      const savedAt = new Date().toISOString();
      localStorage.setItem(draftKey, JSON.stringify({ value, savedAt }));
      setDraftSavedAt(savedAt);
      setDraftRestored(false);
    }, 500);
    return () => clearTimeout(t);
  }, [value, isNew, draftKey]);

  // Save draft immediately on browser close / tab close
  useEffect(() => {
    if (!isNew) return;
    const handler = () => {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ value: valueRef.current, savedAt: new Date().toISOString() })
      );
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isNew, draftKey]);

  // Save draft on component unmount (handles client-side navigation via back button).
  // Skipped if the document was already saved successfully to avoid re-creating the draft.
  useEffect(() => {
    if (!isNew) return;
    return () => {
      if (savedRef.current) return;
      localStorage.setItem(
        draftKey,
        JSON.stringify({ value: valueRef.current, savedAt: new Date().toISOString() })
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getIdValue(id: any): string | null {
    if (!id) return null;
    if (typeof id === "string") return id;
    if (id instanceof ObjectId) return id.toHexString();
    if (id?.$oid) return id.$oid;
    return null;
  }

  const handleSave = async () => {
    setError(null);
    let parsed: any;
    try {
      parsed = EJSON.parse(value);
    } catch (err: any) {
      setError(err.message);
      return;
    }

    const token = localStorage.getItem("token");

    if (!isNew) {
      const originalId = getIdValue(originalDocRef.current?._id);
      const parsedId = getIdValue(parsed?._id);
      if (originalId && parsedId && parsedId !== originalId) {
        setError("_id cannot be modified");
        return;
      }
    }

    setSaving(true);
    try {
      let res: Response;
      if (isNew) {
        res = await fetch(`/api/rooms/${roomId}/collections/${collection}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: value,
        });
      } else {
        const id = getIdValue(originalDocRef.current?._id);
        res = await fetch(`/api/rooms/${roomId}/collections/${collection}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: value,
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to save");
      }

      // Clear draft after successful save and mark so unmount cleanup doesn't re-create it
      if (isNew) {
        localStorage.removeItem(draftKey);
        savedRef.current = true;
      }

      // Notify DocumentTable to refresh its data
      window.dispatchEvent(new CustomEvent("mongoedit:saved"));
      router.back();
    } catch (e: any) {
      setError(e?.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem(draftKey);
    setValue("{\n  \n}");
    setDraftSavedAt(null);
    setDraftRestored(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-sm text-gray-500 font-mono">{collection}</span>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">
          {isNew ? "New Document" : "Edit Document"}
        </span>

        {isNew && draftSavedAt && (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 ml-1 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {draftRestored
              ? `Draft restored · ${formatTime(draftSavedAt)}`
              : `Draft auto-saved · ${formatTime(draftSavedAt)}`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isNew && draftSavedAt && (
            <button
              onClick={handleClearDraft}
              className="text-xs text-gray-400 hover:text-red-500 cursor-pointer px-2 py-1 rounded transition-colors"
            >
              Clear draft
            </button>
          )}
          <Button
            variant="outline"
            onClick={() => router.back()}
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
      </div>

      {/* Monaco Editor — takes all remaining height */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={(v) => setValue(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm flex-shrink-0">
          {error}
        </div>
      )}
    </div>
  );
}
