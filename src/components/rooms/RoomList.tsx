"use client";

import { useEffect, useRef, useState } from "react";
import { useRooms } from "./useRooms";
import CreateRoomDialog from "./CreateRoomDialog";
import InviteUserDialog from "./InviteUserDialog";
import InviteStatusDialog from "./InviteStatusDialog";
import RoomMembersModal from "./RoomMembersModal";
import EditRoomDialog from "./EditRoomDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).userId ?? null;
  } catch { return null; }
}

type RoomListProps = {
  onSelect: (id: string, role: string) => void;
  activeRoomId: string | null;
  onReady?: () => void;
  onRoleResolved?: (role: string) => void;
};

export default function RoomList({ onSelect, activeRoomId, onReady, onRoleResolved }: RoomListProps) {
  const { rooms, loading, reload } = useRooms();
  const currentUserId = typeof window !== "undefined" ? getCurrentUserId() : null;
  const onReadyCalled = useRef(false);

  useEffect(() => {
    if (!loading && !onReadyCalled.current) {
      onReadyCalled.current = true;
      onReady?.();
    }
  }, [loading]);

  // When rooms finish loading and there is already an activeRoomId (restored from
  // sessionStorage), resolve the correct role from the actual room data.
  useEffect(() => {
    if (loading || !rooms.length || !activeRoomId || !onRoleResolved) return;
    const activeRoom = rooms.find(r => r._id === activeRoomId);
    if (!activeRoom) return;
    const uid = getCurrentUserId();
    const myMember = activeRoom.members?.find((m: any) => m.userId === uid);
    onRoleResolved(myMember?.role ?? "viewer");
  }, [loading, rooms]);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteRoomId, setInviteRoomId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [membersRoom, setMembersRoom] = useState<{ id: string; name: string } | null>(null);
  const [editRoom, setEditRoom] = useState<{ id: string; name: string } | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

      {/* Search */}
      <div className="px-2.5 py-2 border-b border-gray-200 flex-shrink-0">
        <input
          placeholder="Search room..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-2 py-1 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 outline-none focus:border-gray-400"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map((room) => {
          const isActive = room._id === activeRoomId;
          return (
            <div
              key={room._id}
              className={`flex items-center justify-between px-3.5 py-2 cursor-pointer transition-colors
                ${isActive ? "bg-[#111]" : "hover:bg-white"}`}
              onClick={() => {
                const myMember = room.members?.find((m: any) => m.userId === currentUserId);
                onSelect(room._id, myMember?.role ?? "viewer");
              }}
            >
              <span className={`text-[13px] truncate flex-1 ${isActive ? "text-white font-medium" : "text-gray-800"}`}>
                {room.name}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`text-[15px] leading-none px-0.5 cursor-pointer ${isActive ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⋯
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditRoom({ id: room._id, name: room.name });
                    }}
                  >
                    <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </DropdownMenuItem>

                  {/* Anggota — paling atas */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setMembersRoom({ id: room._id, name: room.name });
                    }}
                  >
                    <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Anggota
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setInviteRoomId(room._id);
                      setInviteOpen(true);
                    }}
                  >
                    <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Invite
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteRoom({ id: room._id, name: room.name });
                    }}
                  >
                    <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
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
      <RoomMembersModal
        open={!!membersRoom}
        onClose={() => setMembersRoom(null)}
        roomId={membersRoom?.id ?? ""}
        roomName={membersRoom?.name ?? ""}
        onExited={() => { setMembersRoom(null); reload(); }}
      />
      <EditRoomDialog
        open={!!editRoom}
        onClose={() => setEditRoom(null)}
        onUpdated={reload}
        room={editRoom}
      />
      <ConfirmDialog
        open={!!deleteRoom}
        onClose={() => setDeleteRoom(null)}
        title="Hapus Room"
        message={`Yakin ingin menghapus room "${deleteRoom?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteRoom) return;
          setDeleting(true);
          try {
            await fetch(`/api/rooms/${deleteRoom.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setDeleteRoom(null);
            reload();
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
