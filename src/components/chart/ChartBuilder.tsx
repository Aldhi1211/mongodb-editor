"use client";

import { ReactFlowProvider } from "@xyflow/react";
import ChartSidebar from "./ChartSidebar";
import ChartCanvas from "./ChartCanvas";

type Props = {
  initialData?: { nodes: any[]; edges: any[] };
  onSave?: (nodes: any[], edges: any[]) => void;
};

export default function ChartBuilder({ initialData, onSave }: Props) {
  return (
    <ReactFlowProvider>
      <div className="flex w-full h-full">
        <ChartSidebar />
        <ChartCanvas initialData={initialData} onSave={onSave} />
      </div>
    </ReactFlowProvider>
  );
}
