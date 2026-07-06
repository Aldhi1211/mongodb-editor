import type { NavView } from "@/components/navbar";

/** Single source of truth for the room-scoped URL scheme. */

export const roomCollectionsPath = (roomId: string) => `/room/${roomId}/collection`;

export const roomCollectionPath = (roomId: string, name: string) =>
  `/room/${roomId}/collection/${encodeURIComponent(name)}`;

export const roomViewPath = (roomId: string, view: NavView) =>
  view === "collections" ? roomCollectionsPath(roomId) : `/room/${roomId}/${view}`;

/**
 * Path for switching clusters while staying on the same sub-view:
 * `/room/A/charts` → `/room/B/charts`. A collection name is dropped
 * (`/room/A/collection/users` → `/room/B/collection`) since it belongs to the
 * old room's database.
 */
export const switchRoomPath = (pathname: string, newRoomId: string) => {
  const m = pathname.match(/^\/room\/[^/]+\/(collection|charts|audit|drafts)/);
  const sub = m?.[1] ?? "collection";
  return `/room/${newRoomId}/${sub}`;
};
