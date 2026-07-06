"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

import { NavBarMenu, type NavView } from "@/components/navbar";
import { useRooms } from "@/components/rooms/useRooms";
import ManageClustersModal from "@/components/rooms/ManageClustersModal";
import { roomViewPath } from "@/lib/routes";

/** Legacy `/?view=` links (old SPA + the /drafts and /chart redirect stubs). */
function mapViewParam(raw: string | null): NavView | null {
  if (raw === "data" || raw === "collections") return "collections";
  if (raw === "audit") return "audit";
  if (raw === "charts" || raw === "chart") return "charts";
  if (raw === "drafts") return "drafts";
  return null;
}

/**
 * Redirect hub. Navigation now lives in the URL (`/room/[roomId]/…`); this page
 * only authenticates, picks the last-visited (or first) cluster, and redirects
 * there. Users with no clusters get the empty state + manage modal.
 */
export default function Home() {
  const router = useRouter();
  const { rooms, loaded, reload } = useRooms();

  const [token, setToken] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.replace("/login"); return; }
    try {
      const decoded: any = jwtDecode(t);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      setToken(t);
    } catch {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [router]);

  // Once rooms are known, forward to the last-visited cluster (or the first one).
  useEffect(() => {
    if (!token || !loaded || rooms.length === 0) return;
    const lastId = localStorage.getItem("mongoedit:lastRoomId");
    const target = rooms.find((r) => r._id === lastId) ?? rooms[0];
    const view = mapViewParam(new URLSearchParams(window.location.search).get("view"));
    router.replace(roomViewPath(target._id, view ?? "collections"));
  }, [token, loaded, rooms, router]);

  if (!token) return null;

  // Only the zero-cluster empty state actually renders; with clusters present
  // the effect above redirects away.
  if (!loaded || rooms.length > 0) return null;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <NavBarMenu rooms={[]} activeRoomId={null} onManageClusters={() => setManageOpen(true)} />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <EmptyClusterState onManage={() => setManageOpen(true)} />
      </div>

      <ManageClustersModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        rooms={rooms}
        reload={reload}
        activeRoomId={null}
        onSelect={(id) => router.push(roomViewPath(id, "collections"))}
      />
    </div>
  );
}

function EmptyClusterState({ onManage }: { onManage: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
      <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 grid place-items-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
          <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[14px] font-medium text-neutral-700">No cluster selected</p>
        <p className="text-[12px] text-neutral-400 mt-1">Pick a cluster from the navbar, or connect a new one.</p>
      </div>
      <button
        onClick={onManage}
        className="px-4 py-2 rounded-lg text-[13px] font-medium bg-neutral-900 hover:bg-neutral-700 text-white cursor-pointer"
      >
        Manage clusters
      </button>
    </div>
  );
}
