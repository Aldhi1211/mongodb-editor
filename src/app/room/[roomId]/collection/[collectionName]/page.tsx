"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { EJSON } from "bson";

import { NavBarMenu } from "@/components/navbar";
import { useRoomShell } from "@/components/rooms/RoomShell";
import DocumentTable from "@/components/documents/DocumentTable";
import DocumentEditor from "@/components/documents/DocumentEditor";
import { getEjsonIdString } from "@/lib/ejsonShell";
import { roomCollectionsPath } from "@/lib/routes";

type Editing = { mode: "new" | "edit"; docId?: string; doc?: any } | null;

/**
 * Reads the one-shot draft-continue params (?new=1 / ?edit=<docId>) used by the
 * drafts page. For edits, the original document is recovered from the stored
 * draft so the editor gets the same baseline as the inline flow.
 */
function editingFromSearch(roomId: string, params: URLSearchParams): Editing {
  if (params.get("new") === "1") return { mode: "new" };
  const docId = params.get("edit");
  if (!docId) return null;
  let doc: any = null;
  try {
    const raw = localStorage.getItem(`mongoedit:editdraft:${roomId}:${docId}`);
    const originalDoc = raw ? JSON.parse(raw)?.originalDoc : null;
    if (originalDoc) doc = EJSON.parse(originalDoc);
  } catch { /* editor restores from draft */ }
  return { mode: "edit", docId, doc };
}

export default function CollectionDocumentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ collectionName: string }>();
  const { rooms, roomId, roomName, userRole, canWrite, selectRoom, openManage } = useRoomShell();

  const collection = decodeURIComponent(params.collectionName);
  const searchParams = useSearchParams();

  const [editing, setEditing] = useState<Editing>(null);

  // Open the editor for a draft-continue navigation, then strip the one-shot
  // params so refresh/back doesn't reopen it. useSearchParams (not
  // window.location, which is still the previous URL while this route renders).
  useEffect(() => {
    const fromSearch = editingFromSearch(roomId, searchParams);
    if (fromSearch) {
      setEditing(fromSearch);
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleEditDoc = (doc: any) => {
    // Table rows are EJSON-*serialized* plain objects; convert back to BSON so the
    // editor matches the /edit path (which parses from EJSON to BSON before display).
    const docId = getEjsonIdString(doc._id);
    let bson: any = doc;
    try { bson = EJSON.deserialize(doc, { relaxed: false }); } catch { /* fall back to raw */ }
    setEditing({ mode: "edit", docId, doc: bson });
  };

  const handleNewDoc = () => setEditing({ mode: "new" });

  const goCollections = () => router.push(roomCollectionsPath(roomId));

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <NavBarMenu
        view="collections"
        rooms={rooms}
        activeRoomId={roomId}
        onSelectRoom={selectRoom}
        onManageClusters={openManage}
        onCreate={canWrite && !editing ? handleNewDoc : undefined}
        createLabel="New document"
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {editing ? (
          <DocumentEditor
            key={`${roomId}:${collection}:${editing.docId ?? "new"}`}
            roomId={roomId}
            collection={collection}
            isNew={editing.mode === "new"}
            docId={editing.docId}
            initialDoc={editing.doc}
            cluster={roomName}
            onClose={() => setEditing(null)}
            onSaved={() => setEditing(null)}
            onNavigateCluster={goCollections}
            onNavigateCollection={() => setEditing(null)}
          />
        ) : (
          <DocumentTable
            roomId={roomId}
            collection={collection}
            userRole={userRole}
            cluster={roomName}
            onEdit={handleEditDoc}
            onNew={handleNewDoc}
            onNavigateCluster={goCollections}
          />
        )}
      </div>
    </div>
  );
}
