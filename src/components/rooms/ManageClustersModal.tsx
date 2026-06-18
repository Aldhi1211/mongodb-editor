"use client";

import { useState } from "react";
import { X, Plus, Pencil, Users, UserPlus, Trash2 } from "lucide-react";
import CreateRoomDialog from "./CreateRoomDialog";
import InviteUserDialog from "./InviteUserDialog";
import InviteStatusDialog from "./InviteStatusDialog";
import RoomMembersModal from "./RoomMembersModal";
import EditRoomDialog from "./EditRoomDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Room = { _id: string; name: string; members?: any[] };

type Props = {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  reload: () => void;
  /** Currently active cluster id (highlighted in the list). */
  activeRoomId?: string | null;
  /** Selecting a row makes it the active cluster and closes the modal. */
  onSelect?: (id: string) => void;
};

/**
 * Cluster management surface opened from the navbar Clusters dropdown. Absorbs the
 * room CRUD/member/invite flows that previously lived in the RoomList sidebar.
 */
export default function ManageClustersModal({ open, onClose, rooms, reload, activeRoomId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteRoomId, setInviteRoomId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [membersRoom, setMembersRoom] = useState<{ id: string; name: string } | null>(null);
  const [editRoom, setEditRoom] = useState<{ id: string; name: string } | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!open) return null;

  const filtered = rooms
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-[14px] font-semibold text-neutral-900">Manage clusters</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">{rooms.length} cluster{rooms.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 grid place-items-center rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-100">
          <input
            placeholder="Search cluster…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-[13px] text-neutral-800 outline-none focus:border-neutral-400"
          />
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-neutral-900 hover:bg-neutral-700 text-white cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="text-[12px] text-neutral-400 text-center py-10">No clusters found</p>
          )}
          {filtered.map((room) => {
            const isActive = room._id === activeRoomId;
            return (
              <div
                key={room._id}
                className={`flex items-center gap-2 px-5 py-2.5 transition-colors ${isActive ? "bg-neutral-50" : "hover:bg-neutral-50"}`}
              >
                <button
                  onClick={() => onSelect?.(room._id)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-neutral-900" : "bg-neutral-300"}`} />
                  <span className="truncate font-mono text-[13px] text-neutral-900">{room.name}</span>
                </button>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    title="Edit"
                    onClick={() => setEditRoom({ id: room._id, name: room.name })}
                    className="w-7 h-7 grid place-items-center rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Members"
                    onClick={() => setMembersRoom({ id: room._id, name: room.name })}
                    className="w-7 h-7 grid place-items-center rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Invite"
                    onClick={() => { setInviteRoomId(room._id); setInviteOpen(true); }}
                    className="w-7 h-7 grid place-items-center rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => setDeleteRoom({ id: room._id, name: room.name })}
                    className="w-7 h-7 grid place-items-center rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nested dialogs */}
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
      <EditRoomDialog open={!!editRoom} onClose={() => setEditRoom(null)} onUpdated={reload} room={editRoom} />
      <ConfirmDialog
        open={!!deleteRoom}
        onClose={() => setDeleteRoom(null)}
        title="Hapus Cluster"
        message={`Yakin ingin menghapus cluster "${deleteRoom?.name}"? Tindakan ini tidak dapat dibatalkan.`}
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
