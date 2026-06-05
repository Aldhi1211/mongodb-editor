"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2, Plus, Trash2, LayoutGrid, Clock, ChevronRight, Loader2, Search,
} from "lucide-react";

type Chart = {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

function CreateDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError("");
    try {
      await onCreate(name, desc);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-[14px] font-semibold text-gray-900">Create New Chart</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Add a chart to your workspace</p>
        </div>
        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-600">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Sales Report Flow"
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:border-[#7c8cf8] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-600">Description <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe what this chart does…"
              rows={3}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:border-[#7c8cf8] transition-colors resize-none"
            />
          </div>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-[12px] font-medium bg-[#7c8cf8] hover:bg-[#6b7cf7] text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Chart
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline charts list for the home SPA. Clicking a chart opens the /chart/[id] builder. */
export default function ChartListView({ onReady }: { onReady?: () => void }) {
  const router = useRouter();
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const token = () => localStorage.getItem("token");

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/charts", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setCharts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
      onReady?.();
    }
  }, [onReady]);

  useEffect(() => { fetchCharts(); }, [fetchCharts]);

  const handleCreate = async (name: string, description: string) => {
    const res = await fetch("/api/charts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    router.push(`/chart/${data._id}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this chart?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/charts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      setCharts((prev) => prev.filter((c) => c._id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const filtered = charts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-gray-900">Chart Builder</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {charts.length} chart{charts.length !== 1 ? "s" : ""} in your workspace
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7c8cf8] hover:bg-[#6b7cf7] text-white rounded-lg text-[13px] font-medium transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Chart
          </button>
        </div>

        {charts.length > 0 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search charts…"
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:border-[#7c8cf8] transition-colors"
            />
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        )}

        {!loading && charts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <LayoutGrid className="w-7 h-7 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-gray-500">No charts yet</p>
              <p className="text-[12px] text-gray-400 mt-1">Create your first chart to get started</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c8cf8] hover:bg-[#6b7cf7] text-white rounded-lg text-[13px] font-medium transition-all cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              Create Chart
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((chart) => (
              <button
                key={chart._id}
                onClick={() => router.push(`/chart/${chart._id}`)}
                className="group relative text-left bg-white border border-gray-200 hover:border-[#7c8cf8]/40 rounded-xl p-4 transition-all hover:bg-gray-50 hover:shadow-sm block cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#7c8cf8]/10 border border-[#7c8cf8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BarChart2 className="w-4 h-4 text-[#7c8cf8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-[#7c8cf8] transition-colors">
                      {chart.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-4">
                      {chart.description || "No description"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    {timeAgo(chart.updatedAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      onClick={(e) => handleDelete(chart._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                    >
                      {deleting === chart._id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#7c8cf8] transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && charts.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[13px] text-gray-400">No charts match &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateDialog onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
