"use client";

import { NavBarMenu } from "@/components/navbar";
import { useRoomShell } from "@/components/rooms/RoomShell";
import ChartListView from "@/components/charts/ChartListView";

export default function ChartsPage() {
  const { rooms, roomId, selectRoom, openManage } = useRoomShell();

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <NavBarMenu
        view="charts"
        rooms={rooms}
        activeRoomId={roomId}
        onSelectRoom={selectRoom}
        onManageClusters={openManage}
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ChartListView roomId={roomId} />
      </div>
    </div>
  );
}
