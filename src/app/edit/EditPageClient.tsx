"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { EJSON } from "bson";
import DocumentEditor from "@/components/documents/DocumentEditor";

/**
 * Thin wrapper for the standalone `/edit` route. Reads roomId / collection / mode
 * / docId from the URL and the document from sessionStorage ("edit_doc"), then
 * renders the shared <DocumentEditor>. Inline editing in the home SPA uses
 * <DocumentEditor> directly.
 */
export default function EditPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authed, setAuthed] = useState(false);

  // Auth guard: /edit is directly linkable, so verify the JWT before rendering
  // the editor — otherwise an unauthenticated visitor could open it.
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
      setAuthed(true);
    } catch {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [router]);

  const roomId = searchParams.get("roomId") ?? "";
  const collection = searchParams.get("collection") ?? "";
  const isNew = searchParams.get("mode") === "new";
  const docId = searchParams.get("docId") ?? "";

  const initialDoc = useMemo(() => {
    if (isNew) return null;
    // "Edit in New Tab" hands the document off via localStorage (sessionStorage
    // isn't shared across tabs); fall back to sessionStorage for same-tab opens.
    const raw = localStorage.getItem("edit_doc") ?? sessionStorage.getItem("edit_doc");
    if (!raw) return null;
    localStorage.removeItem("edit_doc");
    sessionStorage.removeItem("edit_doc");
    try {
      return EJSON.parse(raw);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This route is reached via "Edit in New Tab", so it has no in-app history to
  // go back to. On close (back / cancel / after save) navigate to the home SPA
  // with this room + collection restored — opening the collection's document table.
  // Use a real navigation (not router.push) so it fires reliably even when called
  // right after the async save; sessionStorage survives a same-tab reload.
  const handleClose = () => {
    if (roomId) sessionStorage.setItem("nav:roomId", roomId);
    if (collection) sessionStorage.setItem("nav:collection", collection);
    else sessionStorage.removeItem("nav:collection");
    window.location.assign("/");
  };

  if (!authed) return null;

  return (
    <div className="h-screen">
      <DocumentEditor
        roomId={roomId}
        collection={collection}
        isNew={isNew}
        docId={docId}
        initialDoc={initialDoc}
        onClose={handleClose}
      />
    </div>
  );
}
