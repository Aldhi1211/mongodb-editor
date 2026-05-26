"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, FilePlus, FilePen, Trash2, FileText, ArrowRight } from "lucide-react";

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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DraftsClient() {
  const router = useRouter();
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
          result.push({
            key,
            type: "add",
            roomId: parsed.roomId,
            collection: parsed.collection,
            value: data.value ?? "{}",
            savedAt: data.savedAt ?? null,
          });
        } catch {}
      } else if (key.startsWith(EDIT_DRAFT_PREFIX)) {
        const parsed = parseEditKey(key);
        if (!parsed) continue;
        try {
          const raw = localStorage.getItem(key);
          const data = raw ? JSON.parse(raw) : {};
          if (!data.collection) continue;
          result.push({
            key,
            type: "edit",
            roomId: parsed.roomId,
            collection: data.collection,
            docId: parsed.docId,
            value: data.value ?? "{}",
            savedAt: data.savedAt ?? null,
            originalDoc: data.originalDoc,
          });
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

  const handleDelete = (key: string) => {
    localStorage.removeItem(key);
    loadDrafts();
  };

  const handleDeleteAll = () => {
    drafts.forEach(d => localStorage.removeItem(d.key));
    loadDrafts();
  };

  const handleContinue = (draft: Draft) => {
    if (draft.type === "add") {
      router.push(`/edit?roomId=${draft.roomId}&collection=${encodeURIComponent(draft.collection)}&mode=new`);
    } else {
      router.push(
        `/edit?roomId=${draft.roomId}&collection=${encodeURIComponent(draft.collection)}&docId=${draft.docId}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-white/[0.06] bg-[#161b22] sticky top-0 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <span className="text-[13px] font-medium text-gray-200">Drafts</span>

        {drafts.length > 0 && (
          <span className="text-[10px] font-semibold text-gray-500 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-full">
            {drafts.length}
          </span>
        )}

        {drafts.length > 1 && (
          <button
            onClick={handleDeleteAll}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-[14px] font-medium text-gray-400 mb-1.5">No drafts saved</p>
            <p className="text-[12px] text-gray-600 max-w-xs leading-relaxed">
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
                  className="group relative flex items-start gap-4 p-4 rounded-xl bg-[#161b22] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                >
                  {/* Type icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isAdd
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-blue-500/10 border border-blue-500/20"
                    }`}
                  >
                    {isAdd ? (
                      <FilePlus className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FilePen className="w-4 h-4 text-blue-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          isAdd
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}
                      >
                        {isAdd ? "New" : "Edit"}
                      </span>
                      <span className="text-[13px] font-semibold font-mono text-gray-200 truncate">
                        {draft.collection}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded flex-shrink-0">
                        …{draft.roomId.slice(-6)}
                      </span>
                    </div>

                    {/* Doc ID for edit drafts */}
                    {!isAdd && draft.docId && (
                      <p className="text-[11px] text-gray-500 font-mono truncate mb-1">
                        <span className="text-gray-600">_id:</span> {draft.docId}
                      </p>
                    )}

                    {/* Field preview */}
                    <p className="text-[11px] text-gray-500 font-mono truncate">
                      {previewDoc(draft.value)}
                    </p>

                    {/* Timestamp */}
                    {draft.savedAt && (
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-2.5 h-2.5 text-gray-600" />
                        <span
                          className="text-[10px] text-gray-600"
                          title={formatAbsoluteTime(draft.savedAt)}
                        >
                          {formatRelativeTime(draft.savedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(draft.key)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleContinue(draft)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.14] text-gray-200 cursor-pointer transition-colors"
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
