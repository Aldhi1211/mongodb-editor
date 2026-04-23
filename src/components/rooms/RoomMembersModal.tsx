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

export default function RoomMembersModal({
  open,
  onClose,
  roomId,
  roomName,
}: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [kicking, setKicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = () => localStorage.getItem("token");

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

  const handleKick = async (userId: string) => {
    setKicking(userId);
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
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setKicking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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
              return (
                <div key={m.userId} className="flex items-center gap-3 py-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0 uppercase">
                    {m.email.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-800 truncate">{m.email}</div>
                  </div>

                  {/* Role badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>

                  {/* Kick button */}
                  {!isOwner && (
                    <button
                      disabled={kicking === m.userId}
                      onClick={() => handleKick(m.userId)}
                      className="text-[11px] text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {kicking === m.userId ? "…" : "Kick"}
                    </button>
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
