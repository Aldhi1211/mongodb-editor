"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { EJSON } from "bson";

import { NavBarMenu, type NavView } from "@/components/navbar";
import { useRooms } from "@/components/rooms/useRooms";
import ManageClustersModal from "@/components/rooms/ManageClustersModal";
import CollectionList from "@/components/collections/CollectionList";
import DocumentTable from "@/components/documents/DocumentTable";
import DocumentEditor from "@/components/documents/DocumentEditor";
import AuditViewer from "@/components/AuditViewer";
import ChartListView from "@/components/charts/ChartListView";
import DraftsView, { type Draft } from "@/components/drafts/DraftsView";
import { getEjsonIdString } from "@/lib/ejsonShell";

type Editing = { mode: "new" | "edit"; docId?: string; doc?: any } | null;

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).userId ?? null;
  } catch {
    return null;
  }
}

function mapViewParam(raw: string | null): NavView | null {
  if (raw === "data" || raw === "collections") return "collections";
  if (raw === "audit") return "audit";
  if (raw === "charts" || raw === "chart") return "charts";
  if (raw === "drafts") return "drafts";
  return null;
}

export default function Home() {
  const router = useRouter();
  const { rooms, reload } = useRooms();

  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<NavView>("collections");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [collection, setCollection] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [manageOpen, setManageOpen] = useState(false);

  // Guard: don't persist nav state before the initial restore has run.
  const navRestored = useRef(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.replace("/login"); return; }
    try {
      const decoded: any = jwtDecode(t);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      setToken(t);
      const v = mapViewParam(new URLSearchParams(window.location.search).get("view"));
      if (v) setView(v);
      const savedRoomId = sessionStorage.getItem("nav:roomId");
      const savedCollection = sessionStorage.getItem("nav:collection");
      if (savedRoomId) setActiveRoomId(savedRoomId);
      if (savedCollection) setCollection(savedCollection);
      navRestored.current = true;
    } catch {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [router]);

  // Auto-select the first cluster if none restored once rooms have loaded.
  useEffect(() => {
    if (!navRestored.current) return;
    if (!activeRoomId && rooms.length) setActiveRoomId(rooms[0]._id);
  }, [rooms, activeRoomId]);

  // Persist last-visited cluster + collection across navigations.
  useEffect(() => {
    if (!navRestored.current) return;
    if (activeRoomId) sessionStorage.setItem("nav:roomId", activeRoomId);
  }, [activeRoomId]);
  useEffect(() => {
    if (!navRestored.current) return;
    if (collection) sessionStorage.setItem("nav:collection", collection);
    else sessionStorage.removeItem("nav:collection");
  }, [collection]);

  // Resolve the current user's role for the active cluster from live room data.
  const userRole = useMemo(() => {
    const uid = getCurrentUserId();
    const room = rooms.find((r) => r._id === activeRoomId);
    const member = room?.members?.find((m: any) => m.userId === uid);
    return member?.role ?? "viewer";
  }, [rooms, activeRoomId]);

  const activeRoomName = useMemo(
    () => rooms.find((r) => r._id === activeRoomId)?.name ?? null,
    [rooms, activeRoomId],
  );

  // ── handlers ──
  const handleSelectRoom = (id: string) => {
    setActiveRoomId(id);
    setCollection(null);
    setEditing(null);
    setView("collections");
    setManageOpen(false);
  };

  const handleViewChange = (v: NavView) => {
    setView(v);
    if (v === "collections") { setCollection(null); setEditing(null); }
  };

  const handleSelectCollection = (name: string) => {
    setCollection(name);
    setEditing(null);
  };

  const handleEditDoc = (doc: any) => {
    // Table rows are EJSON-*serialized* plain objects; convert back to BSON so the
    // editor matches the /edit path (which parses from EJSON to BSON before display).
    const docId = getEjsonIdString(doc._id);
    let bson: any = doc;
    try { bson = EJSON.deserialize(doc, { relaxed: false }); } catch { /* fall back to raw */ }
    setEditing({ mode: "edit", docId, doc: bson });
  };

  const handleNewDoc = () => setEditing({ mode: "new" });

  const handleContinueDraft = (draft: Draft) => {
    setActiveRoomId(draft.roomId);
    setCollection(draft.collection);
    let doc: any = null;
    if (draft.type === "edit" && draft.originalDoc) {
      try { doc = EJSON.parse(draft.originalDoc); } catch { /* editor restores from draft */ }
    }
    setEditing(
      draft.type === "add"
        ? { mode: "new" }
        : { mode: "edit", docId: draft.docId, doc },
    );
    setView("collections");
  };

  if (!token) return null;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <NavBarMenu
        view={view}
        onViewChange={handleViewChange}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
        onManageClusters={() => setManageOpen(true)}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {view === "collections" && (
          <>
            {!activeRoomId ? (
              <EmptyClusterState onManage={() => setManageOpen(true)} />
            ) : editing ? (
              <DocumentEditor
                key={`${activeRoomId}:${collection}:${editing.docId ?? "new"}`}
                roomId={activeRoomId}
                collection={collection ?? ""}
                isNew={editing.mode === "new"}
                docId={editing.docId}
                initialDoc={editing.doc}
                cluster={activeRoomName}
                onClose={() => setEditing(null)}
                onSaved={() => setEditing(null)}
                onNavigateCluster={() => { setEditing(null); setCollection(null); }}
                onNavigateCollection={() => setEditing(null)}
              />
            ) : collection ? (
              <DocumentTable
                roomId={activeRoomId}
                collection={collection}
                userRole={userRole}
                cluster={activeRoomName}
                onEdit={handleEditDoc}
                onNew={handleNewDoc}
                onNavigateCluster={() => setCollection(null)}
              />
            ) : (
              <CollectionList
                roomId={activeRoomId}
                roomName={activeRoomName ?? undefined}
                activeCollection={collection}
                onSelect={handleSelectCollection}
                userRole={userRole}
              />
            )}
          </>
        )}

        {view === "audit" && (
          <div className="flex-1 overflow-auto bg-white">
            <AuditViewer />
          </div>
        )}

        {view === "charts" && <ChartListView />}

        {view === "drafts" && <DraftsView onContinue={handleContinueDraft} />}
      </div>

      <ManageClustersModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        rooms={rooms}
        reload={reload}
        activeRoomId={activeRoomId}
        onSelect={handleSelectRoom}
      />
    </div>
  );
}

function EmptyClusterState({ onManage }: { onManage: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
      <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 grid place-items-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
          <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[14px] font-medium text-neutral-700">No cluster selected</p>
        <p className="text-[12px] text-neutral-400 mt-1">Pick a cluster from the navbar, or connect a new one.</p>
      </div>
      <button
        onClick={onManage}
        className="px-4 py-2 rounded-lg text-[13px] font-medium bg-neutral-900 hover:bg-neutral-700 text-white cursor-pointer"
      >
        Manage clusters
      </button>
    </div>
  );
}
