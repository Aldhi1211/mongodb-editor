"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

  return (
    <div className="h-screen">
      <DocumentEditor
        roomId={roomId}
        collection={collection}
        isNew={isNew}
        docId={docId}
        initialDoc={initialDoc}
        onClose={() => router.back()}
      />
    </div>
  );
}
