"use client";

import { NavBarMenu } from "@/components/navbar";
import { useRoomShell } from "@/components/rooms/RoomShell";
import AuditViewer from "@/components/AuditViewer";

export default function AuditPage() {
  const { rooms, roomId, selectRoom, openManage } = useRoomShell();

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <NavBarMenu
        view="audit"
        rooms={rooms}
        activeRoomId={roomId}
        onSelectRoom={selectRoom}
        onManageClusters={openManage}
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-white">
          <AuditViewer />
        </div>
      </div>
    </div>
  );
}
