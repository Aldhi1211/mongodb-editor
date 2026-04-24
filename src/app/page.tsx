"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoomList from "@/components/rooms/RoomList";
import CollectionList from "@/components/CollectionList";
import DocumentTable from "@/components/documents/DocumentTable";
import AuditViewer from "@/components/AuditViewer";
import { LogOut, Database } from "lucide-react";
import { jwtDecode } from "jwt-decode";

export default function Home() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [collection, setCollection] = useState<string | null>(null);
  const [tab, setTab] = useState<"data" | "audit">("data");
  const [tabLoading, setTabLoading] = useState(true);

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
        setUserEmail((decoded as any).email || "");
      }
    } catch {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, []);

  const handleTabChange = (t: "data" | "audit") => {
    if (t === tab) return;
    setTabLoading(true);
    setTab(t);
    if (t === "data") { setRoomId(null); setCollection(null); }
  };

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
      <div className="flex items-center justify-between px-5 h-12 bg-[#0c0c0c] border-b border-[#1f1f1f] flex-shrink-0">

        {/* Left — Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] flex items-center justify-center">
            <Database className="w-3.5 h-3.5 text-[#7c8cf8]" />
          </div>
          <span className="text-white text-[13px] font-semibold tracking-tight">MongoStudio</span>
          <div className="w-px h-4 bg-[#2a2a2a] ml-1" />
        </div>

        {/* Center — Tabs */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-[#181818] rounded-lg p-1 border border-[#272727]">
          {(["data", "audit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-5 py-1.5 rounded-md text-[12px] font-medium cursor-pointer transition-all
                ${tab === t
                  ? "bg-white text-[#111] shadow-sm"
                  : "text-[#666] hover:text-[#bbb]"
                }`}
            >
              {t === "data" ? "Data" : "Audit Log"}
            </button>
          ))}
        </div>

        {/* Right — User + Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#181818] border border-[#272727] rounded-lg px-2.5 py-1.5">
            <div className="w-5 h-5 rounded-full bg-[#7c8cf8] flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
              {userEmail.charAt(0) || "?"}
            </div>
            <span className="text-[#888] text-[11px] max-w-[150px] truncate leading-none">{userEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[#666] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-[#1a1a1a] border border-transparent hover:border-[#2a2a2a] text-[12px] cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Tab loading overlay */}
        {tabLoading && (
          <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-2 border-t-gray-700 animate-spin" />
            </div>
            <span className="text-[12px] text-gray-400 tracking-wide">
              {tab === "audit" ? "Loading audit logs…" : "Loading data…"}
            </span>
          </div>
        )}

        {tab === "data" && (
          <>
            <RoomList
              activeRoomId={roomId}
              onSelect={setRoomId}
              onReady={() => setTabLoading(false)}
            />
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
            <AuditViewer onReady={() => setTabLoading(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
