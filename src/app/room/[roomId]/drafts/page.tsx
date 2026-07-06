"use client";

import { useRouter } from "next/navigation";

import { NavBarMenu } from "@/components/navbar";
import { useRoomShell } from "@/components/rooms/RoomShell";
import DraftsView, { type Draft } from "@/components/drafts/DraftsView";
import { roomCollectionPath } from "@/lib/routes";

export default function DraftsPage() {
  const router = useRouter();
  const { rooms, roomId, selectRoom, openManage } = useRoomShell();

  // The URL carries the draft's own roomId, so continuing a draft from another
  // cluster lands on that cluster's collection page.
  const handleContinue = (draft: Draft) => {
    const base = roomCollectionPath(draft.roomId, draft.collection);
    const query = draft.type === "add" ? "?new=1" : `?edit=${encodeURIComponent(draft.docId ?? "")}`;
    router.push(base + query);
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <NavBarMenu
        view="drafts"
        rooms={rooms}
        activeRoomId={roomId}
        onSelectRoom={selectRoom}
        onManageClusters={openManage}
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <DraftsView onContinue={handleContinue} />
      </div>
    </div>
  );
}
