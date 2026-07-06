"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

import { useRooms } from "@/components/rooms/useRooms";
import ManageClustersModal from "@/components/rooms/ManageClustersModal";
import { switchRoomPath } from "@/lib/routes";

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).userId ?? null;
  } catch {
    return null;
  }
}

type RoomShellContextValue = {
  rooms: any[];
  reload: () => void;
  roomId: string;
  roomName: string | null;
  userRole: string;
  canWrite: boolean;
  selectRoom: (id: string) => void;
  openManage: () => void;
};

const RoomShellContext = createContext<RoomShellContextValue | null>(null);

export function useRoomShell() {
  const ctx = useContext(RoomShellContext);
  if (!ctx) throw new Error("useRoomShell must be used inside <RoomShell>");
  return ctx;
}

/**
 * Shared shell for every `/room/[roomId]/…` page: JWT auth guard, the single
 * rooms fetch, role resolution, cluster switching, and the manage-clusters
 * modal. Pages render their own <NavBarMenu> with values from useRoomShell().
 */
export default function RoomShell({ roomId, children }: { roomId: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { rooms, loaded, reload } = useRooms();

  const [token, setToken] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  // Auth guard: every room route is only reachable with a valid, unexpired JWT.
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

  // A room the user is not a member of (or that no longer exists) bounces to /.
  useEffect(() => {
    if (!loaded) return;
    if (!rooms.some((r) => r._id === roomId)) router.replace("/");
  }, [loaded, rooms, roomId, router]);

  // Remember the last-visited cluster for the / redirect hub.
  useEffect(() => {
    localStorage.setItem("mongoedit:lastRoomId", roomId);
  }, [roomId]);

  // Resolve the current user's role for this cluster from live room data.
  const userRole = useMemo(() => {
    const uid = getCurrentUserId();
    const room = rooms.find((r) => r._id === roomId);
    const member = room?.members?.find((m: any) => m.userId === uid);
    return member?.role ?? "viewer";
  }, [rooms, roomId]);

  const roomName = useMemo(
    () => rooms.find((r) => r._id === roomId)?.name ?? null,
    [rooms, roomId],
  );

  const value = useMemo<RoomShellContextValue>(
    () => ({
      rooms,
      reload,
      roomId,
      roomName,
      userRole,
      canWrite: userRole !== "viewer",
      selectRoom: (id: string) => {
        setManageOpen(false);
        router.push(switchRoomPath(pathname, id));
      },
      openManage: () => setManageOpen(true),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rooms, roomId, roomName, userRole, pathname],
  );

  if (!token) return null;

  return (
    <RoomShellContext.Provider value={value}>
      {children}
      <ManageClustersModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        rooms={rooms}
        reload={reload}
        activeRoomId={roomId}
        onSelect={value.selectRoom}
      />
    </RoomShellContext.Provider>
  );
}
