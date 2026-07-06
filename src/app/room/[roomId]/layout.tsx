"use client";

import { useParams } from "next/navigation";
import RoomShell from "@/components/rooms/RoomShell";

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ roomId: string }>();
  return <RoomShell roomId={params.roomId}>{children}</RoomShell>;
}
