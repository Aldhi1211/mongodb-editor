"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  BackgroundVariant,
  Panel,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import { useCallback, useRef, useEffect, useState } from "react";
import { FormNode, ValidationNode, MasterdataNode, PdfNode, ReportsNode, EndNode } from "./ChartNode";
import { MousePointer2, Save } from "lucide-react";
import NodeFieldsPanel from "./NodeFieldsPanel";

const nodeTypes = {
  form: FormNode,
  validation: ValidationNode,
  masterdata: MasterdataNode,
  pdf: PdfNode,
  reports: ReportsNode,
  end: EndNode,
};

const NODE_COLORS: Record<string, string> = {
  form: "#6366f1",
  validation: "#f59e0b",
  masterdata: "#8b5cf6",
  pdf: "#ef4444",
  reports: "#10b981",
  end: "#f43f5e",
};

const LABELS: Record<string, string> = {
  form: "Form",
  validation: "Validation",
  masterdata: "Masterdata",
  pdf: "PDF",
  reports: "Reports",
};

const newId = () => `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const EDGE_STYLE = { stroke: "#7c8cf8", strokeWidth: 1.5 };

type Props = {
  initialData?: { nodes: any[]; edges: any[] };
  onSave?: (nodes: any[], edges: any[]) => void;
  /** View-only mode: no connecting/deleting, drop is ignored. */
  readOnly?: boolean;
};

export default function ChartCanvas({ initialData, onSave, readOnly = false }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialData?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialData?.edges ?? []);
  const [fieldsNode, setFieldsNode] = useState<Node | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (initialData) {
      setNodes(initialData.nodes ?? []);
      setEdges(initialData.edges ?? []);
      setFieldsNode(null);
    }
  }, [initialData]);

  // Clicking a node that carries `fields` opens the inspector panel.
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setFieldsNode(node?.data && "fields" in node.data ? node : null);
  }, []);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: EDGE_STYLE } as Edge, eds)
      ),
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (readOnly) return;
      const type = e.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const newNode: Node = {
        id: newId(),
        type,
        position,
        data: { label: LABELS[type] || type },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes, readOnly]
  );

  const handleSave = useCallback(() => {
    onSave?.(nodes, edges);
  }, [onSave, nodes, edges]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  return (
    <div ref={wrapperRef} className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ animated: true, style: EDGE_STYLE }}
        style={{ backgroundColor: "#080808" }}
        fitView
        nodesConnectable={!readOnly}
        deleteKeyCode={readOnly ? null : "Delete"}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e1e1e" />

        <Controls style={{ background: "#111", border: "1px solid #222", borderRadius: 10 }} />

        <MiniMap
          nodeColor={(node) => NODE_COLORS[node.type || ""] || "#444"}
          style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10 }}
          maskColor="#00000066"
        />

        {/* Save button + node/edge count */}
        <Panel position="top-right">
          <div className="flex items-center gap-2">
            {nodes.length > 0 && (
              <div className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-[11px] text-[#555]">
                <span>{nodes.length} node{nodes.length !== 1 ? "s" : ""}</span>
                {edges.length > 0 && (
                  <>
                    <span className="w-px h-3 bg-[#222] inline-block" />
                    <span>{edges.length} edge{edges.length !== 1 ? "s" : ""}</span>
                  </>
                )}
              </div>
            )}
            {onSave && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-[#111] border border-[#222] hover:border-[#7c8cf8] rounded-lg px-3 py-1.5 text-[11px] text-[#666] hover:text-[#7c8cf8] transition-all cursor-pointer"
                title="Save (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            )}
          </div>
        </Panel>

        {nodes.length === 0 && (
          <Panel position="top-center" style={{ marginTop: "28vh", pointerEvents: "none" }}>
            <div className="flex flex-col items-center gap-3 select-none">
              <div className="w-12 h-12 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center">
                <MousePointer2 className="w-5 h-5 text-[#333]" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-[#333]">Canvas is empty</p>
                <p className="text-[11px] text-[#2a2a2a] mt-0.5">Drag components from the sidebar</p>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {fieldsNode && (
        <NodeFieldsPanel node={fieldsNode} onClose={() => setFieldsNode(null)} />
      )}
    </div>
  );
}
