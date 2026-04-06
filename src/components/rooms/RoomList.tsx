"use client";

import { useState } from "react";
import { useRooms } from "./useRooms";
import CreateRoomDialog from "./CreateRoomDialog";
import InviteUserDialog from "./InviteUserDialog";
import InviteStatusDialog from "./InviteStatusDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RoomListProps = {
  onSelect: (id: string) => void;
  activeRoomId: string | null;
};

export default function RoomList({ onSelect, activeRoomId }: RoomListProps) {
  const { rooms, reload } = useRooms();
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteRoomId, setInviteRoomId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  return (
    <div className="w-[180px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 h-[41px] border-b border-gray-200 flex-shrink-0">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.05em]">Rooms</span>
        <button
          onClick={() => setCreateOpen(true)}
          className="w-[22px] h-[22px] rounded-md bg-white border border-gray-300 flex items-center justify-center text-[16px] leading-none text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          +
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {rooms.map((room) => {
          const isActive = room._id === activeRoomId;
          return (
            <div
              key={room._id}
              className={`flex items-center justify-between px-3.5 py-2 cursor-pointer
                ${isActive ? "bg-white" : "hover:bg-white"}`}
              onClick={() => onSelect(room._id)}
            >
              <span className="text-[13px] text-gray-800 truncate flex-1">{room.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-gray-400 hover:text-gray-600 text-[15px] leading-none px-0.5 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⋯
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setInviteRoomId(room._id);
                      setInviteOpen(true);
                    }}
                  >
                    Invite
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await fetch(`/api/rooms/${room._id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                      });
                      reload();
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      <CreateRoomDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      <InviteUserDialog
        open={inviteOpen}
        roomId={inviteRoomId}
        onClose={() => setInviteOpen(false)}
        onResult={(type, msg) => setStatus({ type, msg })}
      />
      <InviteStatusDialog status={status} onClose={() => setStatus(null)} />
    </div>
  );
}
