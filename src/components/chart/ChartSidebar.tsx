"use client";

import { FileText, Database, FileDown, BarChart3 } from "lucide-react";

const SIDEBAR_ITEMS = [
  { type: "form", label: "Form", Icon: FileText, color: "#6366f1", desc: "Input form node" },
  { type: "masterdata", label: "Masterdata", Icon: Database, color: "#8b5cf6", desc: "Data source node" },
  { type: "pdf", label: "PDF", Icon: FileDown, color: "#ef4444", desc: "PDF output node" },
  { type: "reports", label: "Reports", Icon: BarChart3, color: "#10b981", desc: "Report generator" },
];

export default function ChartSidebar() {
  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-[210px] h-full bg-[#0f0f0f] border-r border-[#1a1a1a] flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b border-[#1a1a1a]">
        <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Components</p>
      </div>

      <div className="flex flex-col gap-1.5 p-3 flex-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map(({ type, label, Icon, color, desc }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#222] bg-[#141414] cursor-grab active:cursor-grabbing hover:border-[#333] hover:bg-[#1a1a1a] transition-all select-none group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ backgroundColor: color + "20", border: `1px solid ${color}40` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[12px] font-semibold text-[#ccc]">{label}</span>
              <span className="text-[10px] text-[#444] truncate">{desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-[#1a1a1a]">
        <p className="text-[10px] text-[#333] leading-4">
          Drag components to the canvas to add nodes
        </p>
      </div>
    </div>
  );
}
