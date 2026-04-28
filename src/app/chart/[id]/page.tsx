"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Database, ArrowLeft, BarChart2, Save, Loader2, Check } from "lucide-react";

const ChartBuilder = dynamic(() => import("@/components/chart/ChartBuilder"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#080808]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-7 h-7">
          <div className="absolute inset-0 rounded-full border-2 border-[#1f1f1f]" />
          <div className="absolute inset-0 rounded-full border-2 border-t-[#7c8cf8] animate-spin" />
        </div>
        <span className="text-[12px] text-[#444]">Loading canvas…</span>
      </div>
    </div>
  ),
});

export default function ChartEditorPage() {
  const router = useRouter();
  const params = useParams();
  const chartId = params.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [chartName, setChartName] = useState("");
  const [initialData, setInitialData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

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
        setUserEmail(decoded.email || "");
      }
    } catch {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    if (!token || !chartId) return;
    fetch(`/api/charts/${chartId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.replace("/chart"); return; }
        setChartName(data.name || "");
        setInitialData({ nodes: data.nodes || [], edges: data.edges || [] });
      });
  }, [token, chartId]);

  const handleSave = useCallback(
    async (nodes: any[], edges: any[]) => {
      if (!token) return;
      setSaveState("saving");
      try {
        await fetch(`/api/charts/${chartId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nodes, edges }),
        });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("idle");
      }
    },
    [token, chartId]
  );

  if (!token || !initialData) return null;

  return (
    <div className="h-screen flex flex-col bg-[#080808] overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 h-12 bg-[#0c0c0c] border-b border-[#1a1a1a] flex-shrink-0">

        {/* Left */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] flex items-center justify-center">
            <Database className="w-3.5 h-3.5 text-[#7c8cf8]" />
          </div>
          <span className="text-white text-[13px] font-semibold tracking-tight">MongoStudio</span>
          <div className="w-px h-4 bg-[#252525] mx-1" />
          <Link href="/chart" className="text-[#555] hover:text-[#7c8cf8] text-[12px] transition-colors">
            Charts
          </Link>
          <span className="text-[#333] text-[12px]">/</span>
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-[#7c8cf8]" />
            <span className="text-[13px] font-medium text-white max-w-[200px] truncate">{chartName}</span>
          </div>
        </div>

        {/* Center hint */}
        <p className="absolute left-1/2 -translate-x-1/2 text-[11px] text-[#2a2a2a] select-none hidden lg:block">
          Press <kbd className="px-1 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[#555] text-[10px]">Del</kbd> to remove selected nodes
        </p>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Save button — passed down via context trick, triggered from canvas */}
          <div id="save-status" className="flex items-center gap-1.5 text-[11px] text-[#444]">
            {saveState === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
            {saveState === "saved" && <><Check className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-500">Saved</span></>}
          </div>

          <div className="flex items-center gap-2 bg-[#141414] border border-[#222] rounded-lg px-2.5 py-1.5">
            <div className="w-5 h-5 rounded-full bg-[#7c8cf8] flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
              {userEmail.charAt(0) || "?"}
            </div>
            <span className="text-[#666] text-[11px] max-w-[120px] truncate leading-none">{userEmail}</span>
          </div>
          <Link
            href="/chart"
            className="flex items-center gap-1.5 text-[#555] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-[#1a1a1a] border border-transparent hover:border-[#252525] text-[12px] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 overflow-hidden">
        <ChartBuilder initialData={initialData} onSave={handleSave} />
      </div>
    </div>
  );
}
