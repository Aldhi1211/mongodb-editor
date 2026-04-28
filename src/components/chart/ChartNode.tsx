"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { FileText, Database, FileDown, BarChart3, Pencil, Check, X } from "lucide-react";

type NodeConfig = { label: string; Icon: React.ElementType; color: string };

const NODE_CONFIGS: Record<string, NodeConfig> = {
  form:       { label: "Form",       Icon: FileText,  color: "#6366f1" },
  masterdata: { label: "Masterdata", Icon: Database,  color: "#8b5cf6" },
  pdf:        { label: "PDF",        Icon: FileDown,  color: "#ef4444" },
  reports:    { label: "Reports",    Icon: BarChart3, color: "#10b981" },
};

function ChartNodeBase({ id, data, selected, nodeType }: NodeProps & { nodeType: string }) {
  const { updateNodeData } = useReactFlow();
  const config = NODE_CONFIGS[nodeType] || NODE_CONFIGS.form;
  const { Icon, color } = config;

  const currentLabel = (data?.label as string) || config.label;
  const currentDesc  = (data?.description as string) || "";

  // --- name edit state ---
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName]       = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // --- desc edit state ---
  const [editingDesc, setEditingDesc] = useState(false);
  const [tempDesc, setTempDesc]       = useState("");
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editingName) nameInputRef.current?.select(); }, [editingName]);
  useEffect(() => { if (editingDesc) descInputRef.current?.select(); }, [editingDesc]);

  const startEditName = () => {
    setTempName(currentLabel);
    setEditingName(true);
    setEditingDesc(false);
  };

  const saveName = useCallback(() => {
    updateNodeData(id, { label: tempName.trim() || config.label });
    setEditingName(false);
  }, [id, tempName, config.label, updateNodeData]);

  const cancelName = () => {
    setEditingName(false);
  };

  const startEditDesc = () => {
    setTempDesc(currentDesc);
    setEditingDesc(true);
    setEditingName(false);
  };

  const saveDesc = useCallback(() => {
    updateNodeData(id, { description: tempDesc.trim() });
    setEditingDesc(false);
  }, [id, tempDesc, updateNodeData]);

  const cancelDesc = () => {
    setEditingDesc(false);
  };

  // stop node drag when interacting with inputs
  const stopDrag = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

  return (
    <div
      style={{
        borderColor: selected ? "#7c8cf8" : "#2a2a2a",
        boxShadow: selected ? "0 0 0 2px #7c8cf844" : "0 4px 24px #00000088",
      }}
      className="rounded-xl border-2 bg-[#131313] min-w-[200px] max-w-[260px] overflow-hidden"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#111", border: `2px solid ${color}`, width: 10, height: 10 }}
      />

      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-[#1f1f1f]"
        style={{ backgroundColor: color + "18" }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + "33", border: `1px solid ${color}55` }}
        >
          <Icon className="w-3 h-3" style={{ color }} />
        </div>

        {editingName ? (
          <div className="flex items-center gap-1 flex-1 nodrag" onMouseDown={stopDrag}>
            <input
              ref={nameInputRef}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                stopDrag(e);
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") cancelName();
              }}
              className="flex-1 bg-[#0c0c0c] border border-[#7c8cf8] rounded-md px-2 py-0.5 text-[12px] text-white outline-none min-w-0"
            />
            <button onClick={saveName} className="text-emerald-400 hover:text-emerald-300 cursor-pointer p-0.5">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancelName} className="text-[#555] hover:text-[#888] cursor-pointer p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 flex-1 group/name cursor-text min-w-0"
            onDoubleClick={startEditName}
            title="Double-click to rename"
          >
            <span className="text-[12px] font-semibold text-white truncate flex-1">
              {currentLabel}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); startEditName(); }}
              className="opacity-0 group-hover/name:opacity-100 text-[#3a3a3a] hover:text-[#7c8cf8] transition-all cursor-pointer flex-shrink-0 nodrag"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Body / Description ── */}
      <div className="px-3 py-2.5">
        {editingDesc ? (
          <div className="flex flex-col gap-1.5 nodrag" onMouseDown={stopDrag}>
            <textarea
              ref={descInputRef}
              value={tempDesc}
              onChange={(e) => setTempDesc(e.target.value)}
              onKeyDown={(e) => {
                stopDrag(e);
                if (e.key === "Escape") cancelDesc();
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveDesc();
              }}
              placeholder="Add a description…"
              rows={3}
              className="w-full bg-[#0c0c0c] border border-[#7c8cf8] rounded-md px-2 py-1.5 text-[11px] text-white placeholder-[#333] outline-none resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#333]">Ctrl+Enter to save</span>
              <div className="flex gap-1">
                <button onClick={saveDesc} className="text-emerald-400 hover:text-emerald-300 cursor-pointer p-0.5">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={cancelDesc} className="text-[#555] hover:text-[#888] cursor-pointer p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="group/desc cursor-text flex items-start gap-1.5"
            onDoubleClick={startEditDesc}
            title="Double-click to edit description"
          >
            <p className={`text-[11px] flex-1 leading-4 ${currentDesc ? "text-[#666]" : "text-[#333] italic"}`}>
              {currentDesc || "No description"}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); startEditDesc(); }}
              className="opacity-0 group-hover/desc:opacity-100 text-[#3a3a3a] hover:text-[#7c8cf8] transition-all cursor-pointer flex-shrink-0 mt-0.5 nodrag"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#111", border: `2px solid ${color}`, width: 10, height: 10 }}
      />
    </div>
  );
}

export const FormNode       = (props: NodeProps) => <ChartNodeBase {...props} nodeType="form" />;
export const MasterdataNode = (props: NodeProps) => <ChartNodeBase {...props} nodeType="masterdata" />;
export const PdfNode        = (props: NodeProps) => <ChartNodeBase {...props} nodeType="pdf" />;
export const ReportsNode    = (props: NodeProps) => <ChartNodeBase {...props} nodeType="reports" />;
