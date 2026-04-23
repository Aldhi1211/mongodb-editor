"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Member = {
  userId: string;
  email: string;
  role: string;
};

const roleBadge: Record<string, { label: string; cls: string }> = {
  owner:  { label: "Owner",  cls: "bg-purple-100 text-purple-700" },
  admin:  { label: "Admin",  cls: "bg-blue-100 text-blue-700" },
  editor: { label: "Editor", cls: "bg-green-100 text-green-700" },
  viewer: { label: "Viewer", cls: "bg-gray-100 text-gray-600" },
};

function getRoleBadge(role: string) {
  return roleBadge[role] ?? { label: role, cls: "bg-gray-100 text-gray-600" };
}

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).userId ?? null;
  } catch {
    return null;
  }
}

export default function RoomMembersModal({
  open,
  onClose,
  roomId,
  roomName,
  onExited,
}: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  onExited?: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    if (open) setCurrentUserId(getCurrentUserId());
  }, [open]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && roomId) load();
  }, [open, roomId]);

  const handleKickOrExit = async (userId: string) => {
    setActioning(userId);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (userId === currentUserId) {
        onClose();
        onExited?.();
      } else {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActioning(null);
    }
  };

  const handleTransfer = async (targetUserId: string) => {
    setActioning(targetUserId);
    setConfirmTransfer(null);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/members`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActioning(null);
    }
  };

  const iAmOwner = members.find((m) => m.userId === currentUserId)?.role === "owner";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        onCloseAutoFocus={() => { document.body.style.pointerEvents = "auto"; }}
      >
        <DialogHeader>
          <DialogTitle>Anggota — {roomName}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-6 text-center text-sm text-gray-500">Memuat anggota…</div>
        )}

        {error && (
          <div className="text-sm text-red-500 px-1">{error}</div>
        )}

        {!loading && members.length === 0 && !error && (
          <div className="py-6 text-center text-sm text-gray-400">Tidak ada anggota.</div>
        )}

        {!loading && members.length > 0 && (
          <div className="flex flex-col divide-y divide-gray-100">
            {members.map((m) => {
              const badge = getRoleBadge(m.role);
              const isOwner = m.role === "owner";
              const isSelf = m.userId === currentUserId;
              const isConfirming = confirmTransfer === m.userId;
              const isActioning = actioning === m.userId;

              return (
                <div key={m.userId} className="flex items-center gap-3 py-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0 uppercase">
                    {m.email.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-800 truncate">
                      {m.email}
                      {isSelf && <span className="ml-1.5 text-[10px] text-gray-400">(kamu)</span>}
                    </div>
                  </div>

                  {/* Role badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>

                  {/* Actions */}
                  {isConfirming ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-gray-500">Yakin?</span>
                      <button
                        onClick={() => handleTransfer(m.userId)}
                        disabled={isActioning}
                        className="text-[11px] text-white bg-purple-600 hover:bg-purple-700 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Ya
                      </button>
                      <button
                        onClick={() => setConfirmTransfer(null)}
                        className="text-[11px] text-gray-600 hover:text-gray-800 border border-gray-200 hover:bg-gray-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        Tidak
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {/* Transfer button — only owner sees it, on non-owner members that aren't self */}
                      {iAmOwner && !isOwner && !isSelf && (
                        <button
                          disabled={isActioning}
                          onClick={() => setConfirmTransfer(m.userId)}
                          className="text-[11px] text-purple-600 hover:text-purple-800 border border-purple-200 hover:bg-purple-50 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          Transfer
                        </button>
                      )}

                      {/* Exit — current user's own row (non-owner) */}
                      {isSelf && !isOwner && (
                        <button
                          disabled={isActioning}
                          onClick={() => handleKickOrExit(m.userId)}
                          className="text-[11px] text-orange-500 hover:text-orange-700 border border-orange-200 hover:bg-orange-50 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          {isActioning ? "…" : "Keluar"}
                        </button>
                      )}

                      {/* Kick — other members (not self, not owner) */}
                      {!isSelf && !isOwner && (
                        <button
                          disabled={isActioning}
                          onClick={() => handleKickOrExit(m.userId)}
                          className="text-[11px] text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          {isActioning ? "…" : "Kick"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
