"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Drafts now live inline in the home SPA — redirect old links there. */
export default function DraftsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/?view=drafts"); }, [router]);
  return null;
}
