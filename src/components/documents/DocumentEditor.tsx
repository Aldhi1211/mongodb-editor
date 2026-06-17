"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { EJSON, ObjectId } from "bson";
import { ArrowLeft, Check, Clock, FileWarning, Moon, RotateCcw, Sun, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const DRAFT_KEY_PREFIX = "mongoedit:draft:";
const EDIT_DRAFT_KEY_PREFIX = "mongoedit:editdraft:";

export type DocumentEditorProps = {
  roomId: string;
  collection: string;
  isNew: boolean;
  /** Required in edit mode. */
  docId?: string;
  /** EJSON-deserialized document object to edit (edit mode, when no draft exists). */
  initialDoc?: any;
  /** Called when the editor should close without having saved (back / cancel / discard). */
  onClose: () => void;
  /** Called after a successful save. */
  onSaved?: () => void;
  /** Cluster name for the breadcrumb (optional). */
  cluster?: string | null;
  /** Breadcrumb navigation (optional — used by the inline SPA). */
  onNavigateCluster?: () => void;
  onNavigateCollection?: () => void;
};

/**
 * Document editor — Monaco + EJSON + the draft auto-save system. Used both inline
 * (home SPA) and by the standalone `/edit` route via a thin wrapper.
 */
export default function DocumentEditor({
  roomId,
  collection,
  isNew,
  docId = "",
  initialDoc = null,
  onClose,
  onSaved,
  cluster,
  onNavigateCluster,
  onNavigateCollection,
}: DocumentEditorProps) {
  const { isDark, toggle: toggleTheme } = useTheme();

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

  const draftEnabled = isNew || Boolean(docId);

  useEffect(() => {
    valueRef.current = value;
    hasChangesRef.current = value !== initialValueRef.current;
  }, [value]);

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
        } catch {}
      }
    } else {
      const draftRaw = localStorage.getItem(draftKey);
      if (draftRaw) {
        try {
          const draft = JSON.parse(draftRaw);
          if (draft.originalDoc) {
            originalDocRef.current = EJSON.parse(draft.originalDoc);
          }
          const v = draft.value ?? "{}";
          setValue(v);
          initialValueRef.current = v;
          setDraftSavedAt(draft.savedAt ?? null);
          setDraftRestored(true);
          return;
        } catch {}
      }

      if (initialDoc) {
        try {
          originalDocRef.current = initialDoc;
          const formatted = JSON.stringify(EJSON.serialize(initialDoc, { relaxed: false }), null, 2);
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

  useEffect(() => {
    if (!draftEnabled) return;
    const handler = () => {
      if (savedRef.current) return; // already saved/discarded — don't resurrect the draft
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: value,
        });
      } else {
        const id = getIdValue(originalDocRef.current?._id);
        res = await fetch(`/api/rooms/${roomId}/collections/${collection}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: value,
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to save");
      }

      if (draftEnabled) {
        localStorage.removeItem(draftKey);
        savedRef.current = true;
      }

      window.dispatchEvent(new CustomEvent("mongoedit:saved"));
      // Cross-tab refresh: mongoedit:saved is window-scoped, so signal other tabs
      // (e.g. the collection table that opened this via "Edit in New Tab") through
      // localStorage — the `storage` event fires in every *other* tab. SSE can't be
      // relied on for this since its broadcaster is per-instance/in-memory.
      try {
        localStorage.setItem(
          "mongoedit:saved:ping",
          JSON.stringify({ roomId, collection, t: Date.now() }),
        );
      } catch { /* ignore quota errors */ }
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    const hasChanges = value !== initialValueRef.current;
    if (!hasChanges || !draftEnabled) {
      onClose();
      return;
    }
    setShowBackConfirm(true);
  };

  const handleDiscard = () => {
    localStorage.removeItem(draftKey);
    savedRef.current = true;
    setShowBackConfirm(false);
    onClose();
  };

  const handleSaveDraft = () => {
    const data: Record<string, any> = { value: valueRef.current, savedAt: new Date().toISOString() };
    if (!isNew && originalDocRef.current) {
      data.originalDoc = EJSON.stringify(originalDocRef.current);
      data.collection = collection;
    }
    localStorage.setItem(draftKey, JSON.stringify(data));
    setShowBackConfirm(false);
    onClose();
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

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const t = {
    page:        isDark ? "bg-[#0d1117]"                    : "bg-gray-50",
    header:      isDark ? "bg-[#161b22] border-white/[0.06]" : "bg-white border-gray-200",
    divider:     isDark ? "bg-white/10"                     : "bg-gray-200",
    textPrimary: isDark ? "text-gray-100"                   : "text-gray-900",
    textMuted:   isDark ? "text-gray-400"                   : "text-gray-500",
    textFaint:   isDark ? "text-gray-500"                   : "text-gray-400",
    btnGhost:    isDark
      ? "text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]"
      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
    dialog:      isDark ? "bg-[#161b22] border-white/[0.1]" : "bg-white border-gray-200",
    dialogText:  isDark ? "text-gray-100"                   : "text-gray-800",
    dialogSub:   isDark ? "text-gray-400"                   : "text-gray-500",
    errorBar:    isDark
      ? "bg-red-500/10 border-red-500/20 text-red-400"
      : "bg-red-50 border-red-200 text-red-600",
    monacoTheme: isDark ? "vs-dark"                         : "light",
  };

  const crumbClickable = isDark
    ? "text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
    : "text-gray-400 hover:text-gray-700 cursor-pointer transition-colors";

  return (
    <div className={`flex flex-col h-full ${t.page}`}>
      {/* ── Header ── */}
      <div className={`flex items-center gap-0 px-3 h-11 border-b flex-shrink-0 ${t.header}`}>
        {/* Back */}
        <button
          onClick={handleBack}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] cursor-pointer transition-colors mr-1 ${t.btnGhost}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className={`w-px h-4 mx-1 ${t.divider}`} />

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 px-2 min-w-0">
          {cluster && (
            <>
              <button
                onClick={onNavigateCluster}
                disabled={!onNavigateCluster}
                className={`text-[12px] font-mono truncate ${onNavigateCluster ? crumbClickable : t.textMuted}`}
              >
                {cluster}
              </button>
              <span className={`text-[12px] ${t.textFaint}`}>/</span>
            </>
          )}
          <button
            onClick={onNavigateCollection}
            disabled={!onNavigateCollection}
            className={`text-[12px] font-mono truncate ${onNavigateCollection ? crumbClickable : t.textMuted}`}
          >
            {collection}
          </button>
          <span className={`text-[12px] ${t.textFaint}`}>/</span>
          <span className={`text-[12px] font-medium ${t.textPrimary}`}>
            {isNew ? "New Document" : "Edit Document"}
          </span>
        </div>

        {/* Mode badge */}
        <span
          className={`ml-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
            isNew
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25"
              : "bg-blue-500/10 text-blue-600 border border-blue-500/25"
          }`}
        >
          {isNew ? "New" : "Edit"}
        </span>

        {/* Draft status */}
        {draftEnabled && draftSavedAt && (
          <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 select-none">
            <Clock className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-[10px] text-amber-600 font-medium">
              {draftRestored ? "Draft restored" : "Auto-saved"} · {formatTime(draftSavedAt)}
            </span>
          </div>
        )}

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-1">
          {draftEnabled && draftSavedAt && (
            <button
              onClick={handleClearDraft}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] cursor-pointer transition-colors ${
                isDark
                  ? "text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              Reset draft
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-colors ${t.btnGhost}`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <div className={`w-px h-4 mx-0.5 ${t.divider}`} />

          {/* Cancel */}
          <button
            onClick={handleBack}
            className={`px-3 py-1.5 rounded-md text-[12px] cursor-pointer transition-colors ${t.btnGhost}`}
          >
            Cancel
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer transition-colors ml-1"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Monaco Editor ── */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={(v) => setValue(v ?? "")}
          theme={t.monacoTheme}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'Geist Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            lineHeight: 22,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "gutter",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
          }}
        />
      </div>

      {/* ── Error bar ── */}
      {error && (
        <div className={`flex items-start gap-2.5 px-4 py-2.5 border-t text-[12px] flex-shrink-0 ${t.errorBar}`}>
          <FileWarning className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="font-mono leading-snug">{error}</span>
        </div>
      )}

      {/* ── Unsaved-changes dialog ── */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className={`border rounded-xl shadow-2xl w-[360px] overflow-hidden ${t.dialog}`}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileWarning className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className={`text-[13px] font-semibold mb-1 ${t.dialogText}`}>Unsaved changes</p>
                  <p className={`text-[12px] leading-relaxed ${t.dialogSub}`}>
                    Save as a draft to continue later, or discard to leave without saving.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex items-center justify-between gap-2">
              <button
                onClick={handleDiscard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Discard
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBackConfirm(false)}
                  className={`px-3.5 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors ${t.btnGhost}`}
                >
                  Stay
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-amber-500 hover:bg-amber-400 text-black cursor-pointer transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
