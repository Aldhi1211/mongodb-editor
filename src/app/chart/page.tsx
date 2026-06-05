"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Charts now live inline in the home SPA — redirect old links there. */
export default function ChartPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/?view=charts"); }, [router]);
  return null;
}
