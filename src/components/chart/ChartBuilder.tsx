"use client";

import { ReactFlowProvider } from "@xyflow/react";
import ChartSidebar from "./ChartSidebar";
import ChartCanvas from "./ChartCanvas";

type Props = {
  initialData?: { nodes: any[]; edges: any[] };
  onSave?: (nodes: any[], edges: any[]) => void;
  /** View-only mode: hides the components sidebar and disables editing. */
  readOnly?: boolean;
};

export default function ChartBuilder({ initialData, onSave, readOnly = false }: Props) {
  return (
    <ReactFlowProvider>
      <div className="flex w-full h-full">
        {!readOnly && <ChartSidebar />}
        <ChartCanvas initialData={initialData} onSave={onSave} readOnly={readOnly} />
      </div>
    </ReactFlowProvider>
  );
}
