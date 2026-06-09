"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  BarChart2, LayoutGrid, Clock, ChevronRight, Loader2, Search, ArrowLeft,
} from "lucide-react";
import { getEjsonIdString } from "@/lib/ejsonShell";

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

/** A workflow document fetched from the room's `workflows` collection (EJSON-serialized). */
type Workflow = {
  _id: any;
  name?: string;
  nodes?: any[];
  updatedAt?: any;
  [k: string]: any;
};

const EDGE_STYLE = { stroke: "#7c8cf8", strokeWidth: 1.5 };
/** Dashed green edge for "this node triggers this report" links. */
const REPORT_EDGE_STYLE = { stroke: "#10b981", strokeWidth: 1.5, strokeDasharray: "5 3" };

/** Map a workflow node `type` to a registered chart node type. */
function chartNodeType(rawType: any): string {
  switch (String(rawType || "").toUpperCase()) {
    case "FORM":           return "form";
    case "VALIDATION":     return "validation";
    case "FILE_GENERATOR": return "pdf";
    case "MASTERDATA":     return "masterdata";
    case "REPORTS":        return "reports";
    default:               return "reports"; // generic fallback (registered type)
  }
}

/** Read a possibly EJSON-wrapped number ($numberInt / $numberDouble / $numberLong). */
function ejNum(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object") {
    const raw = v.$numberInt ?? v.$numberDouble ?? v.$numberLong;
    if (raw != null) { const n = Number(raw); return Number.isNaN(n) ? null : n; }
    return null;
  }
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

const EDGE_LABEL_STYLE = { fill: "#9aa0c4", fontSize: 10 };
const EDGE_LABEL_BG = { fill: "#15151b", stroke: "#2a2a33" };

/** A destination ref like `{ node: { nodeId: "form2" } }` → "form2" (or null). */
function destNodeId(dest: any): string | null {
  const nid = dest?.node?.nodeId;
  return nid != null ? String(nid) : null;
}

/**
 * Build ReactFlow nodes + edges from a workflow document.
 * - Each workflow node becomes a chart node (title = name, description = preview.subtitle).
 * - Edges come from three places, all pointing at a same-workflow node id:
 *     · FORM:        routing.defaultDest.node.nodeId   (the normal next step)
 *     · VALIDATION:  routes[].dest.node.nodeId         (conditions, evaluated first)
 *     · fallback:    defaultDest.node.nodeId           (taken only when no route matches → "else")
 *   Links to the same target are merged into one edge; concrete conditions are joined with " / ".
 * - Uses each node's own `position` when all are present & distinct; otherwise BFS auto-layout.
 * - Reports whose `triggers` reference a node in this workflow (`{workflowId}.{nodeId}`) are
 *   appended as green nodes in a lane on the right, with a dashed edge from each trigger node.
 */
function mapWorkflowToFlow(
  wf: Workflow,
  reports: Workflow[] = [],
): { nodes: any[]; edges: any[] } {
  const wfNodes = Array.isArray(wf?.nodes) ? wf.nodes : [];
  const ids = wfNodes.map((n) => String(n?.id));
  const idSet = new Set(ids);

  type EdgeAcc = { source: string; target: string; conds: Set<string>; hasElse: boolean };
  const edgeMap = new Map<string, EdgeAcc>();
  const adj: Record<string, string[]> = {};
  const addLink = (source: string, target: string, cond: string | null, isElse: boolean) => {
    if (!idSet.has(target)) return;
    const key = `${source}->${target}`;
    let e = edgeMap.get(key);
    if (!e) {
      e = { source, target, conds: new Set(), hasElse: false };
      edgeMap.set(key, e);
      (adj[source] ||= []).push(target);
    }
    if (cond) e.conds.add(cond);
    if (isElse) e.hasElse = true;
  };

  for (const n of wfNodes) {
    const source = String(n?.id);
    const hasRoutes = Array.isArray(n?.routes) && n.routes.length > 0;

    // FORM — single normal next step.
    const routingDest = destNodeId(n?.routing?.defaultDest);
    if (routingDest) addLink(source, routingDest, null, false);

    // VALIDATION — conditional routes are matched first.
    if (hasRoutes) {
      for (const r of n.routes) {
        const t = destNodeId(r?.dest);
        if (!t) continue;
        const v = r?.value != null ? String(r.value) : "";
        addLink(source, t, v && !v.includes("${") ? v : null, false);
      }
    }

    // Fallback: defaultDest is the "else" branch only when routes exist; otherwise just the next step.
    const topDest = destNodeId(n?.defaultDest);
    if (topDest) addLink(source, topDest, null, hasRoutes);
  }

  const edges = [...edgeMap.values()].map((e) => {
    const parts = [...e.conds];
    if (e.hasElse) parts.push("else");
    const label = parts.length ? parts.join(" / ") : undefined;
    return {
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      ...(label ? { label } : {}),
      animated: true,
      style: EDGE_STYLE,
      labelStyle: EDGE_LABEL_STYLE,
      labelBgStyle: EDGE_LABEL_BG,
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
    };
  });

  // Prefer stored positions only when every node has one and they don't all overlap.
  const stored = wfNodes.map((n) => {
    const x = ejNum(n?.position?.x);
    const y = ejNum(n?.position?.y);
    return x != null && y != null ? { x, y } : null;
  });
  const distinct = new Set(stored.filter(Boolean).map((p) => `${p!.x},${p!.y}`));
  const useStored = stored.every(Boolean) && distinct.size === stored.length;

  // Auto-layout: BFS shortest-depth from roots → column index (cycle-safe).
  const indeg: Record<string, number> = {};
  ids.forEach((id) => (indeg[id] = 0));
  edges.forEach((e) => { if (e.source !== e.target) indeg[e.target] = (indeg[e.target] ?? 0) + 1; });
  let roots = ids.filter((id) => indeg[id] === 0);
  if (roots.length === 0 && ids.length) roots = [ids[0]]; // fully cyclic fallback

  const depth: Record<string, number> = {};
  const queue: string[] = [];
  roots.forEach((id) => { depth[id] = 0; queue.push(id); });
  while (queue.length) {
    const cur = queue.shift()!;
    for (const t of adj[cur] ?? []) {
      if (depth[t] === undefined) { depth[t] = depth[cur] + 1; queue.push(t); }
    }
  }
  ids.forEach((id) => { if (depth[id] === undefined) depth[id] = 0; }); // disconnected → col 0

  // A node with no outgoing workflow edge is a terminal/end step
  // (e.g. routing.defaultDest.node === null, or no routes match).
  const sourceIds = new Set(edges.map((e) => e.source));

  const COL = 340;
  const ROW = 200;
  const rowCount: Record<number, number> = {};
  const nodes = wfNodes.map((n, i) => {
    const id = String(n?.id);
    const d = depth[id] ?? 0;
    const row = rowCount[d] ?? 0;
    rowCount[d] = row + 1;
    const position = useStored ? stored[i]! : { x: d * COL, y: row * ROW };
    return {
      id,
      type: chartNodeType(n?.type),
      position,
      data: {
        label: n?.name || n?.locTitle || n?.key || id,
        description: n?.description || n?.preview?.subtitle || "",
        terminal: !sourceIds.has(id),
      },
    };
  });

  // ── Reports triggered by this workflow's nodes ──
  // A report's `triggers` entry looks like "{workflowId}.{nodeId}". We anchor on this
  // workflow's id so node ids containing dots are matched unambiguously.
  const wfId = getEjsonIdString(wf?._id);
  const posById = new Map<string, { x: number; y: number }>(
    nodes.map((n) => [n.id, n.position as { x: number; y: number }]),
  );
  const maxX = nodes.reduce((m, n) => Math.max(m, (n.position as { x: number }).x), 0);

  type RepMatch = { rep: Workflow; triggerNodeIds: string[]; anchorY: number };
  const matches: RepMatch[] = [];
  for (const rep of reports) {
    const triggers = Array.isArray(rep?.triggers) ? rep.triggers : [];
    const triggerNodeIds: string[] = [];
    for (const t of triggers) {
      const s = String(t);
      if (!wfId || !s.startsWith(wfId + ".")) continue;
      const nodeId = s.slice(wfId.length + 1);
      if (idSet.has(nodeId) && !triggerNodeIds.includes(nodeId)) triggerNodeIds.push(nodeId);
    }
    if (triggerNodeIds.length === 0) continue;
    matches.push({ rep, triggerNodeIds, anchorY: posById.get(triggerNodeIds[0])?.y ?? 0 });
  }

  // Lay reports out in a single lane to the right, ordered by their trigger's vertical position.
  matches.sort((a, b) => a.anchorY - b.anchorY);
  const reportX = (matches.length ? maxX + COL : 0);
  const reportNodes = matches.map((m, i) => ({
    id: `report::${getEjsonIdString(m.rep._id)}`,
    type: "reports",
    position: { x: reportX, y: i * ROW },
    data: {
      label: m.rep?.name || m.rep?.key || getEjsonIdString(m.rep._id),
      description: m.rep?.description || (m.rep?.key ? `key: ${m.rep.key}` : ""),
    },
  }));
  const reportEdges = matches.flatMap((m) => {
    const repId = `report::${getEjsonIdString(m.rep._id)}`;
    return m.triggerNodeIds.map((nid) => ({
      id: `${nid}->${repId}`,
      source: nid,
      target: repId,
      label: "triggers",
      animated: true,
      style: REPORT_EDGE_STYLE,
      labelStyle: EDGE_LABEL_STYLE,
      labelBgStyle: EDGE_LABEL_BG,
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
    }));
  });

  return { nodes: [...nodes, ...reportNodes], edges: [...edges, ...reportEdges] };
}

function timeAgo(iso?: any) {
  const raw = iso?.$date ?? iso;
  const ms = typeof raw === "string" ? Date.parse(raw) : Number(raw);
  if (!ms || Number.isNaN(ms)) return null;
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Inline workflows list for the home SPA. Reads the active room's `workflows` collection. */
export default function ChartListView({ roomId }: { roomId?: string | null }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [reports, setReports] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Workflow | null>(null);

  const token = () => localStorage.getItem("token");

  const fetchWorkflows = useCallback(async () => {
    if (!roomId) { setWorkflows([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/collections/workflows?limit=500`,
        { headers: { Authorization: `Bearer ${token()}` } },
      );
      const json = await res.json();
      setWorkflows(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Reports power the trigger links drawn into the read-only flow diagram.
  const fetchReports = useCallback(async () => {
    if (!roomId) { setReports([]); return; }
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/collections/reports?limit=500`,
        { headers: { Authorization: `Bearer ${token()}` } },
      );
      const json = await res.json();
      setReports(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setReports([]);
    }
  }, [roomId]);

  // Reset selection + reload whenever the active room changes.
  useEffect(() => { setSelected(null); fetchWorkflows(); fetchReports(); }, [fetchWorkflows, fetchReports]);

  const filtered = workflows.filter((w) => {
    const q = search.toLowerCase();
    const idStr = getEjsonIdString(w._id).toLowerCase();
    return idStr.includes(q) || (w.name || "").toLowerCase().includes(q);
  });

  const flow = useMemo(
    () => (selected ? mapWorkflowToFlow(selected, reports) : null),
    [selected, reports],
  );

  // ── Builder view (read-only) ──
  if (selected && flow) {
    const title = getEjsonIdString(selected._id);
    const reportCount = flow.nodes.filter((n) => String(n.id).startsWith("report::")).length;
    const wfNodeCount = flow.nodes.length - reportCount;
    return (
      <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden">
        <div className="flex items-center gap-3 px-5 h-12 bg-[#0c0c0c] border-b border-[#1a1a1a] flex-shrink-0">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-[#555] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-[#1a1a1a] border border-transparent hover:border-[#252525] text-[12px] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="w-px h-4 bg-[#252525]" />
          <BarChart2 className="w-3.5 h-3.5 text-[#7c8cf8]" />
          <span className="text-[13px] font-medium text-white font-mono max-w-[260px] truncate">{title}</span>
          {selected.name && (
            <span className="text-[12px] text-[#555] max-w-[260px] truncate">{selected.name}</span>
          )}
          <span className="ml-auto text-[11px] text-[#444]">
            {wfNodeCount} node{wfNodeCount !== 1 ? "s" : ""}
            {reportCount > 0 && ` · ${reportCount} report${reportCount !== 1 ? "s" : ""}`}
            {" · view only"}
          </span>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <ChartBuilder initialData={flow} readOnly />
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-gray-900">Workflows</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""} in this cluster
            </p>
          </div>
        </div>

        {!roomId && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <LayoutGrid className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-[13px] text-gray-400">Select a cluster to view its workflows</p>
          </div>
        )}

        {roomId && workflows.length > 0 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows…"
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:border-[#7c8cf8] transition-colors"
            />
          </div>
        )}

        {roomId && loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        )}

        {roomId && !loading && workflows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <LayoutGrid className="w-7 h-7 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-gray-500">No workflows yet</p>
              <p className="text-[12px] text-gray-400 mt-1">This cluster has no <span className="font-mono">workflows</span> collection data</p>
            </div>
          </div>
        )}

        {roomId && !loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((wf) => {
              const idStr = getEjsonIdString(wf._id);
              const ago = timeAgo(wf.updatedAt);
              const nodeCount = Array.isArray(wf.nodes) ? wf.nodes.length : 0;
              return (
                <button
                  key={idStr}
                  onClick={() => setSelected(wf)}
                  className="group relative text-left bg-white border border-gray-200 hover:border-[#7c8cf8]/40 rounded-xl p-4 transition-all hover:bg-gray-50 hover:shadow-sm block cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#7c8cf8]/10 border border-[#7c8cf8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BarChart2 className="w-4 h-4 text-[#7c8cf8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-900 truncate font-mono group-hover:text-[#7c8cf8] transition-colors">
                        {idStr}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-4">
                        {wf.name || "Untitled workflow"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      {ago ? (<><Clock className="w-3 h-3" />{ago}</>) : (
                        <span>{nodeCount} node{nodeCount !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#7c8cf8] transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {roomId && !loading && workflows.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[13px] text-gray-400">No workflows match &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}
