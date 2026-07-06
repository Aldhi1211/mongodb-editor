"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { NavBarMenu } from "@/components/navbar";
import { useRoomShell } from "@/components/rooms/RoomShell";
import CollectionList from "@/components/collections/CollectionList";
import { roomCollectionPath } from "@/lib/routes";

export default function CollectionListPage() {
  const router = useRouter();
  const { rooms, roomId, roomName, userRole, canWrite, selectRoom, openManage } = useRoomShell();

  const [search, setSearch] = useState("");
  const [addNonce, setAddNonce] = useState(0);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <NavBarMenu
        view="collections"
        rooms={rooms}
        activeRoomId={roomId}
        onSelectRoom={selectRoom}
        onManageClusters={openManage}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search collection…"
        onCreate={canWrite ? () => setAddNonce((n) => n + 1) : undefined}
        createLabel="New collection"
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CollectionList
          roomId={roomId}
          roomName={roomName ?? undefined}
          activeCollection={null}
          onSelect={(name) => router.push(roomCollectionPath(roomId, name))}
          userRole={userRole}
          search={search}
          addSignal={addNonce}
        />
      </div>
    </div>
  );
}
