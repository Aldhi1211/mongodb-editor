"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";

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
    const keys = Object.keys(obj);
    if (keys.length === 0) return "empty document";
    const shown = keys.slice(0, 4).join(", ");
    return keys.length > 4 ? `${shown}, …` : shown;
  } catch {
    return value.slice(0, 80).trim();
  }
}

function formatTime(iso: string): string {
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
        } catch {
          // skip corrupted entry
        }
      } else if (key.startsWith(EDIT_DRAFT_PREFIX)) {
        const parsed = parseEditKey(key);
        if (!parsed) continue;
        try {
          const raw = localStorage.getItem(key);
          const data = raw ? JSON.parse(raw) : {};
          if (!data.collection) continue; // skip incomplete edit drafts
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
        } catch {
          // skip corrupted entry
        }
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
      // Edit draft: navigate to edit page — draft in localStorage will be auto-restored
      router.push(
        `/edit?roomId=${draft.roomId}&collection=${encodeURIComponent(draft.collection)}&docId=${draft.docId}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-12 border-b border-gray-200 flex-shrink-0">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          ← Back
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-sm font-medium text-gray-900">Drafts</span>
        {drafts.length > 0 && (
          <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {drafts.length}
          </span>
        )}
        {drafts.length > 1 && (
          <button
            onClick={handleDeleteAll}
            className="ml-auto text-xs text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">
        {drafts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Tidak ada draft tersimpan</p>
            <p className="text-xs text-gray-300 mt-1">
              Draft dibuat otomatis saat kamu mulai menambah atau mengedit dokumen.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {drafts.map((draft) => (
              <div
                key={draft.key}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">
                      {draft.type === "add" ? "New" : "Edit"}
                    </span>
                    <span className="text-[13px] font-medium font-mono text-gray-900">
                      {draft.collection}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                      room: …{draft.roomId.slice(-6)}
                    </span>
                  </div>
                  {draft.type === "edit" && draft.docId && (
                    <p className="text-[11px] text-gray-400 font-mono truncate mb-0.5">
                      _id: {draft.docId}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 font-mono truncate">
                    {previewDoc(draft.value)}
                  </p>
                  {draft.savedAt && (
                    <p className="text-[11px] text-gray-300 mt-1.5">
                      Disimpan {formatTime(draft.savedAt)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <button
                    onClick={() => handleDelete(draft.key)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Hapus draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleContinue(draft)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-gray-900 text-white hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    Lanjut →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
