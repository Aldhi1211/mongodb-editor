"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoomList from "@/components/rooms/RoomList";
import CollectionList from "@/components/CollectionList";
import DocumentTable from "@/components/documents/DocumentTable";
import AuditViewer from "@/components/AuditViewer";
import { LogOut } from "lucide-react";
import { jwtDecode } from "jwt-decode";

export default function Home() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [collection, setCollection] = useState<string | null>(null);
  const [tab, setTab] = useState<"data" | "audit">("data");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.replace("/login"); return; }
    try {
      const decoded: any = jwtDecode(t);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.replace("/login");
      } else {
        setToken(t);
      }
    } catch {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    if (tab === "data") { setRoomId(null); setCollection(null); }
  }, [tab]);

  useEffect(() => {
    document.body.style.pointerEvents = "auto";
  }, []);

  if (!token) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setRoomId(null);
    setCollection(null);
    router.replace("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 h-11 bg-[#111] flex-shrink-0">
        <div className="flex gap-1">
          {(["data", "audit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-medium capitalize cursor-pointer transition-colors
                ${tab === t ? "bg-white text-[#111]" : "text-[#aaa] hover:text-white"}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 bg-[#ee0033] text-white px-3.5 py-1.5 rounded-md text-[12px] cursor-pointer hover:bg-[#cc0029] transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Logout
        </button>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {tab === "data" && (
          <>
            <RoomList activeRoomId={roomId} onSelect={setRoomId} />
            {roomId && (
              <CollectionList
                roomId={roomId}
                activeCollection={collection}
                onSelect={setCollection}
              />
            )}
            {roomId && collection && (
              <DocumentTable roomId={roomId} collection={collection} />
            )}
          </>
        )}
        {tab === "audit" && (
          <div className="flex-1 overflow-auto">
            <AuditViewer />
          </div>
        )}
      </div>
    </div>
  );
}
