"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { EJSON } from "bson";
import { ObjectId } from "bson";
import { Button } from "@/components/ui/button";

const DRAFT_KEY_PREFIX = "mongoedit:draft:";
const EDIT_DRAFT_KEY_PREFIX = "mongoedit:editdraft:";

export default function EditPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomId = searchParams.get("roomId") ?? "";
  const collection = searchParams.get("collection") ?? "";
  const isNew = searchParams.get("mode") === "new";
  const docId = searchParams.get("docId") ?? "";

  const [value, setValue] = useState("{\n  \n}");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const valueRef = useRef(value);
  const originalDocRef = useRef<any>(null);
  const savedRef = useRef(false);
  const initialValueRef = useRef("{\n  \n}");
  const hasChangesRef = useRef(false);

  const draftKey = isNew
    ? `${DRAFT_KEY_PREFIX}${roomId}:${collection}`
    : `${EDIT_DRAFT_KEY_PREFIX}${roomId}:${docId}`;

  // Whether drafting is enabled for this page instance
  const draftEnabled = isNew || Boolean(docId);

  // Keep refs in sync with latest value
  useEffect(() => {
    valueRef.current = value;
    hasChangesRef.current = value !== initialValueRef.current;
  }, [value]);

  // Initialize editor on mount
  useEffect(() => {
    if (isNew) {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        try {
          const draft = JSON.parse(raw);
          const v = draft.value ?? "{\n  \n}";
          setValue(v);
          initialValueRef.current = v;
          setDraftSavedAt(draft.savedAt ?? null);
          setDraftRestored(true);
        } catch {
          // corrupted draft, ignore and start fresh
        }
      }
    } else {
      // Edit mode: check localStorage draft first
      if (docId) {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          try {
            const draft = JSON.parse(draftRaw);
            if (draft.originalDoc) {
              const doc = EJSON.parse(draft.originalDoc);
              originalDocRef.current = doc;
            }
            const v = draft.value ?? "{}";
            setValue(v);
            initialValueRef.current = v;
            setDraftSavedAt(draft.savedAt ?? null);
            setDraftRestored(true);
            sessionStorage.removeItem("edit_doc");
            return;
          } catch {
            // corrupted draft, fall through to sessionStorage
          }
        }
      }

      // Fall back to document passed via sessionStorage from DocumentTable
      const raw = sessionStorage.getItem("edit_doc");
      if (raw) {
        sessionStorage.removeItem("edit_doc");
        try {
          const doc = EJSON.parse(raw);
          originalDocRef.current = doc;
          const formatted = JSON.stringify(EJSON.serialize(doc, { relaxed: false }), null, 2);
          setValue(formatted);
          initialValueRef.current = formatted;
        } catch {
          setValue("{}");
          initialValueRef.current = "{}";
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save to localStorage — only when there are actual changes
  useEffect(() => {
    if (!draftEnabled) return;
    if (!hasChangesRef.current) return;
    const t = setTimeout(() => {
      const savedAt = new Date().toISOString();
      const data: Record<string, any> = { value, savedAt };
      if (!isNew && originalDocRef.current) {
        data.originalDoc = EJSON.stringify(originalDocRef.current);
        data.collection = collection;
      }
      localStorage.setItem(draftKey, JSON.stringify(data));
      setDraftSavedAt(savedAt);
      setDraftRestored(false);
    }, 500);
    return () => clearTimeout(t);
  }, [value, draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save draft immediately on browser close / tab close — only when there are actual changes
  useEffect(() => {
    if (!draftEnabled) return;
    const handler = () => {
      if (!hasChangesRef.current) return;
      const data: Record<string, any> = { value: valueRef.current, savedAt: new Date().toISOString() };
      if (!isNew && originalDocRef.current) {
        data.originalDoc = EJSON.stringify(originalDocRef.current);
        data.collection = collection;
      }
      localStorage.setItem(draftKey, JSON.stringify(data));
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save draft on component unmount — only when there are actual unsaved changes.
  // Skipped if the document was already saved/discarded (savedRef) or nothing changed.
  useEffect(() => {
    if (!draftEnabled) return;
    return () => {
      if (savedRef.current) return;
      if (!hasChangesRef.current) return;
      const data: Record<string, any> = { value: valueRef.current, savedAt: new Date().toISOString() };
      if (!isNew && originalDocRef.current) {
        data.originalDoc = EJSON.stringify(originalDocRef.current);
        data.collection = collection;
      }
      localStorage.setItem(draftKey, JSON.stringify(data));
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
      if (draftEnabled) {
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

  const handleBack = () => {
    const hasChanges = value !== initialValueRef.current;
    if (!hasChanges || !draftEnabled) {
      router.back();
      return;
    }
    setShowBackConfirm(true);
  };

  const handleDiscard = () => {
    localStorage.removeItem(draftKey);
    savedRef.current = true;
    setShowBackConfirm(false);
    router.back();
  };

  const handleSaveDraft = () => {
    const data: Record<string, any> = { value: valueRef.current, savedAt: new Date().toISOString() };
    if (!isNew && originalDocRef.current) {
      data.originalDoc = EJSON.stringify(originalDocRef.current);
      data.collection = collection;
    }
    localStorage.setItem(draftKey, JSON.stringify(data));
    setShowBackConfirm(false);
    router.back();
  };

  const handleClearDraft = () => {
    localStorage.removeItem(draftKey);
    if (!isNew && originalDocRef.current) {
      const formatted = JSON.stringify(EJSON.serialize(originalDocRef.current, { relaxed: false }), null, 2);
      setValue(formatted);
      initialValueRef.current = formatted;
    } else {
      setValue("{\n  \n}");
      initialValueRef.current = "{\n  \n}";
    }
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
          onClick={handleBack}
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

        {draftEnabled && draftSavedAt && (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 ml-1 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {draftRestored
              ? `Draft restored · ${formatTime(draftSavedAt)}`
              : `Draft auto-saved · ${formatTime(draftSavedAt)}`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {draftEnabled && draftSavedAt && (
            <button
              onClick={handleClearDraft}
              className="text-xs text-gray-400 hover:text-red-500 cursor-pointer px-2 py-1 rounded transition-colors"
            >
              Clear draft
            </button>
          )}
          <Button
            variant="outline"
            onClick={handleBack}
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

      {/* Back confirmation dialog */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-80 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-800">Ada perubahan yang belum disimpan</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[12px] text-gray-500">Simpan sebagai draft atau buang perubahan?</p>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={handleDiscard}
                className="px-3 py-1.5 rounded-lg text-[12px] text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Buang
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBackConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-gray-900 text-white hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  Simpan Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
