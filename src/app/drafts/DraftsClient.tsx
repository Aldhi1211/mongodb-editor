"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, FilePen, FilePlus, FileText, Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const ADD_DRAFT_PREFIX = "mongoedit:draft:";
const EDIT_DRAFT_PREFIX = "mongoedit:editdraft:";

type Draft = {
  key: string;
  type: "add" | "edit";
  roomId: string;
  collection: string;
  docId?: string;
  value: string;
  savedAt: string | null;
  originalDoc?: string;
};

function parseAddKey(key: string): { roomId: string; collection: string } | null {
  const rest = key.slice(ADD_DRAFT_PREFIX.length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) return null;
  return { roomId: rest.slice(0, colonIdx), collection: rest.slice(colonIdx + 1) };
}

function parseEditKey(key: string): { roomId: string; docId: string } | null {
  const rest = key.slice(EDIT_DRAFT_PREFIX.length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) return null;
  return { roomId: rest.slice(0, colonIdx), docId: rest.slice(colonIdx + 1) };
}

function previewDoc(value: string): string {
  try {
    const obj = JSON.parse(value);
    const keys = Object.keys(obj).filter(k => k !== "_id");
    if (keys.length === 0) return "empty document";
    const shown = keys.slice(0, 5).join(", ");
    return keys.length > 5 ? `${shown}, +${keys.length - 5} more` : shown;
  } catch {
    return value.slice(0, 80).trim();
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function DraftsClient() {
  const router = useRouter();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const loadDrafts = () => {
    const result: Draft[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(ADD_DRAFT_PREFIX)) {
        const parsed = parseAddKey(key);
        if (!parsed) continue;
        try {
          const raw = localStorage.getItem(key);
          const data = raw ? JSON.parse(raw) : {};
          result.push({ key, type: "add", roomId: parsed.roomId, collection: parsed.collection, value: data.value ?? "{}", savedAt: data.savedAt ?? null });
        } catch {}
      } else if (key.startsWith(EDIT_DRAFT_PREFIX)) {
        const parsed = parseEditKey(key);
        if (!parsed) continue;
        try {
          const raw = localStorage.getItem(key);
          const data = raw ? JSON.parse(raw) : {};
          if (!data.collection) continue;
          result.push({ key, type: "edit", roomId: parsed.roomId, collection: data.collection, docId: parsed.docId, value: data.value ?? "{}", savedAt: data.savedAt ?? null, originalDoc: data.originalDoc });
        } catch {}
      }
    }
    result.sort((a, b) => {
      if (!a.savedAt) return 1;
      if (!b.savedAt) return -1;
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
    setDrafts(result);
  };

  useEffect(() => {
    loadDrafts();
    window.addEventListener("mongoedit:saved", loadDrafts);
    return () => window.removeEventListener("mongoedit:saved", loadDrafts);
  }, []);

  const handleDelete = (key: string) => { localStorage.removeItem(key); loadDrafts(); };
  const handleDeleteAll = () => { drafts.forEach(d => localStorage.removeItem(d.key)); loadDrafts(); };

  const handleContinue = (draft: Draft) => {
    if (draft.type === "add") {
      router.push(`/edit?roomId=${draft.roomId}&collection=${encodeURIComponent(draft.collection)}&mode=new`);
    } else {
      router.push(`/edit?roomId=${draft.roomId}&collection=${encodeURIComponent(draft.collection)}&docId=${draft.docId}`);
    }
  };

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const t = {
    page:       isDark ? "bg-[#0d1117] text-gray-100"     : "bg-gray-50 text-gray-900",
    header:     isDark ? "bg-[#161b22] border-white/[0.06]" : "bg-white border-gray-200",
    divider:    isDark ? "bg-white/10"                    : "bg-gray-200",
    textPrimary:isDark ? "text-gray-100"                  : "text-gray-900",
    textMuted:  isDark ? "text-gray-400"                  : "text-gray-500",
    textFaint:  isDark ? "text-gray-600"                  : "text-gray-400",
    btnGhost:   isDark
      ? "text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]"
      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
    card:       isDark
      ? "bg-[#161b22] border-white/[0.06] hover:border-white/[0.12]"
      : "bg-white border-gray-200 hover:border-gray-300",
    badge:      isDark ? "bg-white/[0.06] border-white/[0.08] text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500",
    roomBadge:  isDark ? "bg-white/[0.04] text-gray-600"  : "bg-gray-100 text-gray-400",
    continuBtn: isDark
      ? "bg-white/[0.08] hover:bg-white/[0.14] text-gray-200"
      : "bg-gray-900 hover:bg-gray-700 text-white",
    emptyIcon:  isDark ? "bg-white/[0.04] border-white/[0.08]" : "bg-gray-100 border-gray-200",
  };

  return (
    <div className={`min-h-screen ${t.page}`}>
      {/* ── Header ── */}
      <div className={`flex items-center gap-2 px-4 h-12 border-b sticky top-0 z-10 ${t.header}`}>
        <Link
          href="/"
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] transition-colors ${t.btnGhost}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        <div className={`w-px h-4 mx-1 ${t.divider}`} />

        <span className={`text-[13px] font-medium ${t.textPrimary}`}>Drafts</span>

        {drafts.length > 0 && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${t.badge}`}>
            {drafts.length}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {drafts.length > 1 && (
            <button
              onClick={handleDeleteAll}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] cursor-pointer transition-colors ${
                isDark
                  ? "text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <Trash2 className="w-3 h-3" />
              Clear all
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
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${t.emptyIcon}`}>
              <FileText className={`w-6 h-6 ${t.textFaint}`} />
            </div>
            <p className={`text-[14px] font-medium mb-1.5 ${t.textMuted}`}>No drafts saved</p>
            <p className={`text-[12px] max-w-xs leading-relaxed ${t.textFaint}`}>
              Drafts are created automatically when you start adding or editing a document.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {drafts.map((draft) => {
              const isAdd = draft.type === "add";
              return (
                <div
                  key={draft.key}
                  className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all ${t.card}`}
                >
                  {/* Type icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isAdd
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-blue-500/10 border border-blue-500/20"
                    }`}
                  >
                    {isAdd
                      ? <FilePlus className="w-4 h-4 text-emerald-500" />
                      : <FilePen className="w-4 h-4 text-blue-500" />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          isAdd
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        }`}
                      >
                        {isAdd ? "New" : "Edit"}
                      </span>
                      <span className={`text-[13px] font-semibold font-mono truncate ${t.textPrimary}`}>
                        {draft.collection}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${t.roomBadge}`}>
                        …{draft.roomId.slice(-6)}
                      </span>
                    </div>

                    {!isAdd && draft.docId && (
                      <p className={`text-[11px] font-mono truncate mb-1 ${t.textFaint}`}>
                        <span className={t.textFaint}>_id:</span> {draft.docId}
                      </p>
                    )}

                    <p className={`text-[11px] font-mono truncate ${t.textMuted}`}>
                      {previewDoc(draft.value)}
                    </p>

                    {draft.savedAt && (
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className={`w-2.5 h-2.5 ${t.textFaint}`} />
                        <span
                          className={`text-[10px] ${t.textFaint}`}
                          title={formatAbsoluteTime(draft.savedAt)}
                        >
                          {formatRelativeTime(draft.savedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions — visible on hover */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(draft.key)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                        isDark
                          ? "text-gray-600 hover:text-red-400 hover:bg-red-500/10"
                          : "text-gray-300 hover:text-red-500 hover:bg-red-50"
                      }`}
                      title="Delete draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleContinue(draft)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${t.continuBtn}`}
                    >
                      Continue
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
