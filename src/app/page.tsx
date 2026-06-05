"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RoomList from "@/components/rooms/RoomList";
import CollectionList from "@/components/collections/CollectionList";
import DocumentTable from "@/components/documents/DocumentTable";
import AuditViewer from "@/components/AuditViewer";
import { NavBarMenu } from "@/components/navbar";
import { jwtDecode } from "jwt-decode";

export default function Home() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("viewer");
  const [collection, setCollection] = useState<string | null>(null);
  const [tab, setTab] = useState<"data" | "audit">("data");
  const [tabLoading, setTabLoading] = useState(true);
  const [draftCount, setDraftCount] = useState(0);

  // Guard: don't let save effects overwrite sessionStorage before restore has run
  const navRestored = useRef(false);

  // Persist last-visited room + collection so navigating back from /edit restores them.
  // Only runs after navRestored is true to avoid the initial "viewer" default overwriting
  // the previously saved role before the auth effect has a chance to restore it.
  useEffect(() => {
    if (!navRestored.current) return;
    if (roomId) sessionStorage.setItem("nav:roomId", roomId);
  }, [roomId]);
  useEffect(() => {
    if (!navRestored.current) return;
    if (collection) sessionStorage.setItem("nav:collection", collection);
    else sessionStorage.removeItem("nav:collection");
  }, [collection]);

  // Track draft count for topbar badge
  useEffect(() => {
    const count = () =>
      Object.keys(localStorage).filter((k) => k.startsWith("mongoedit:draft:")).length;
    setDraftCount(count());
    const update = () => setDraftCount(count());
    window.addEventListener("mongoedit:saved", update);
    return () => window.removeEventListener("mongoedit:saved", update);
  }, []);

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
        // Restore last-visited room + collection (handles navigate-back from /edit).
        // userRole is NOT stored here — RoomList.onRoleResolved derives it from
        // live room data once rooms finish loading, avoiding stale cached values.
        const savedRoomId = sessionStorage.getItem("nav:roomId");
        const savedCollection = sessionStorage.getItem("nav:collection");
        if (savedRoomId) setRoomId(savedRoomId);
        if (savedCollection) setCollection(savedCollection);
        navRestored.current = true;
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
      <NavBarMenu
        tab={tab}
        onTabChange={handleTabChange}
        draftCount={draftCount}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

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
              onSelect={(id, role) => { setRoomId(id); setUserRole(role); setCollection(null); }}
              onRoleResolved={setUserRole}
              onReady={() => setTabLoading(false)}
            />
            {roomId && (
              <CollectionList
                roomId={roomId}
                activeCollection={collection}
                onSelect={setCollection}
                userRole={userRole}
              />
            )}
            {roomId && collection && (
              <DocumentTable roomId={roomId} collection={collection} userRole={userRole} />
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
