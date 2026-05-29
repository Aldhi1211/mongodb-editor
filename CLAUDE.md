# CLAUDE.md — MongoDB Editor

## Project Overview

A collaborative MongoDB document editor built on Next.js. Users join **rooms**, each room connects to a separate MongoDB database (URI stored encrypted in the core DB). Features include document CRUD, draft auto-save, audit logging with rollback, chart visualization, and real-time updates via SSE.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: MongoDB 5 — two connections:
  - `workflowbuilder_core` — rooms, users, audit logs, backups (via `src/lib/mongodb.ts`)
  - Room DB — per-room user database (via `src/lib/roomDb.ts`, URI decrypted at runtime)
- **UI**: TailwindCSS v4, Radix UI primitives, shadcn components in `src/components/ui/`
- **Editor**: Monaco Editor (`@monaco-editor/react`) — used in `/edit` page
- **BSON**: `bson` library — always use `EJSON.serialize/deserialize/parse` for MongoDB documents, never plain `JSON.parse/stringify`
- **Auth**: JWT (`jsonwebtoken`), stored in `localStorage` as `token`
- **Real-time**: Server-Sent Events (SSE) via `/api/rooms/[roomId]/collections/[collectionName]/stream`

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Environment Variables

Required in `.env`:

```
MONGODB_URI=           # Core MongoDB URI (workflowbuilder_core)
JWT_SECRET=            # JWT signing secret
ROOM_SECRET=           # 32-byte hex key for AES-256-CBC room URI encryption
```

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── api/                        # API routes (Next.js route handlers)
│   │   ├── auth/login|register/    # JWT auth
│   │   ├── rooms/                  # Room CRUD + members + invite
│   │   └── rooms/[roomId]/
│   │       └── collections/
│   │           ├── route.ts        # List / create collections
│   │           └── [collectionName]/
│   │               ├── route.ts    # List / query documents (GET with ?filter=EJSON&page&limit)
│   │               ├── [documentId]/route.ts  # GET / PUT / DELETE single document
│   │               ├── clone/      # Clone collection
│   │               └── stream/     # SSE broadcaster
│   ├── edit/                       # Full-page Monaco editor (new + edit document)
│   ├── drafts/                     # Draft list page
│   ├── chart/                      # Chart builder
│   └── page.tsx                    # Home — room list + collection list + document table
│
├── components/
│   ├── rooms/                      # Room list, dialogs, member management
│   ├── collections/                # CollectionList, CollectionContextMenu
│   ├── documents/                  # DocumentTable, useDocuments hook, context menu, viewer
│   └── ui/                         # shadcn primitives
│
├── hooks/
│   └── useTheme.ts                 # Light/dark toggle, persisted to localStorage
│
└── lib/
    ├── mongodb.ts                  # Core MongoClient singleton (clientPromise)
    ├── roomDb.ts                   # Per-room client (cached, ping-checked, auto-reconnect)
    ├── ejsonShell.ts               # EJSON formatting helpers
    └── auth.ts                     # JWT helpers
```

### Key Data Flows

**Document list**: `DocumentTable` → `useDocuments.fetchData()` → `GET /api/rooms/[roomId]/collections/[collectionName]?page=&limit=`

**Document query**: `DocumentTable` (Filter or Query mode) → `useDocuments.queryData(filter)` → same GET endpoint with `?filter=<EJSON-encoded>`

**Document edit**: `DocumentTable.openEdit(doc)` → `sessionStorage.setItem("edit_doc", EJSON.stringify(doc))` → navigate to `/edit?roomId=&collection=&docId=` → `EditPageClient` reads sessionStorage on mount

**Document save**: `EditPageClient.handleSave()` → `PUT /api/rooms/[roomId]/collections/[collectionName]/[documentId]` → dispatch `mongoedit:saved` CustomEvent → `router.back()`

**Draft system**:
- Add mode key: `mongoedit:draft:{roomId}:{collection}`
- Edit mode key: `mongoedit:editdraft:{roomId}:{docId}`
- Edit drafts store `originalDoc` (EJSON string) + `collection` field in the data object
- `hasChangesRef` guards all saves — drafts are only written when content actually changed from `initialValueRef`

**Real-time refresh**: SSE stream per collection → `useDocuments` `es.onmessage` → `fetchData()`. Also `mongoedit:saved` CustomEvent for same-tab refresh after edit-page save.

## Critical BSON Rules

1. **Never use `JSON.parse` / `JSON.stringify` on MongoDB documents.** Always use `EJSON`.
2. When displaying documents in the editor: `JSON.stringify(EJSON.serialize(doc, { relaxed: false }), null, 2)` — preserves `$oid`, `$numberInt`, `$date`, etc.
3. When sending to API as body: send the raw editor string (already validated EJSON), do not re-stringify.
4. In API routes: `EJSON.deserialize(rawPayload, { relaxed: false })` to convert parsed JSON back to BSON types.
5. In API responses: `EJSON.serialize(doc, { relaxed: false })` before `NextResponse.json()`.

## API Conventions

- All routes check JWT via `getUser(req)` — returns `null` → 401
- Room DB access always via `getRoomDb(roomId)` (handles caching + reconnect)
- PUT/DELETE document: tries `new ObjectId(documentId)` first, falls back to plain string `_id` if not found (handles non-ObjectId `_id`)
- **REQUIRED: Audit log must be written to `workflowbuilder_core.audit_logs` on EVERY mutation** — this includes single document insert/update/delete AND bulk operations (deleteOne, deleteMany, updateOne, updateMany). No exception.
- Backup snapshot written to `workflowbuilder_core.backups` on every update/delete (single and bulk)
- SSE broadcast via `broadcast({ type, roomId, collection, documentId? })` after mutations

### Audit Log Shape

```ts
{
  roomId: string,
  roomName: string,       // snapshot from rooms collection
  collection: string,
  action: string,         // "insert" | "update" | "delete" | "deleteOne" | "deleteMany" | "updateOne" | "updateMany" | "create_collection" | "drop_collection" | "rename_collection"
  before: any,            // document(s) before change; null for inserts
  after: any,             // document(s) after change; null for deletes
  filter?: any,           // for bulk ops: the filter used
  update?: any,           // for bulk update ops: the update pipeline
  userId: string,
  timestamp: Date,
}
```

## Document Table Modes

`DocumentTable` has two search modes (toggle button top-right of header):

- **Filter** — GUI rows: key / operator (IS, REGEX, GT, LT) / value. Multiple conditions with AND/OR toggle.
- **Query** — Raw EJSON textarea, like Robo3T. Ctrl+Enter to run. Full MongoDB operators supported (`$or`, `$and`, `$regex`, `$gt`, etc.).

### Raw Query Mode — supported syntax

```js
db.getCollection('col').find({ status: "active" }).sort({ _id: -1 })
db.getCollection('col').deleteOne({ _id: { $oid: "..." } })
db.getCollection('col').deleteMany({ status: "inactive" })
db.getCollection('col').updateOne({ name: "foo" }, { $set: { age: 30 } })
db.getCollection('col').updateMany({ role: "guest" }, { $set: { active: false } })
```

Write operations (`deleteOne`, `deleteMany`, `updateOne`, `updateMany`) show a **confirmation dialog** before executing. After execution, a result banner shows the affected count. All write ops hit `POST /api/rooms/[roomId]/collections/[collectionName]/bulk` and always write an audit log entry.

## Edit Page (`/edit`)

- `isNew = searchParams.get("mode") === "new"` — new document mode
- `docId = searchParams.get("docId")` — edit mode
- Draft auto-saves every 500ms **only when `hasChangesRef.current === true`** (content differs from initial load)
- Back button: no changes → go back immediately; has changes → show confirmation dialog (Discard / Stay / Save Draft)
- Theme (light/dark) applied via `useTheme()` hook; Monaco theme switches between `light` and `vs-dark`

## Theme System

`src/hooks/useTheme.ts` — reads/writes `mongoedit:theme` in localStorage. Default: `"light"`. Used in `/edit` and `/drafts` pages. Toggle button (sun/moon icon) in page headers.

## Git Conventions

Use **Conventional Commits**:
```
feat(scope): description
fix(scope): description
style(scope): description
refactor(scope): description
docs: description
```

Always include co-author trailer:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Common Pitfalls

- **Don't** use `EJSON.stringify(doc)` (relaxed mode) for display — use `EJSON.serialize(doc, { relaxed: false })`.
- **Don't** save draft on unmount if `hasChangesRef.current === false` — this corrupts existing drafts by overwriting with incomplete data.
- **Don't** store `userRole` in sessionStorage — derive it from live room data via `onRoleResolved` callback in `RoomList`.
- The `/drafts` page uses `mongoedit:saved` CustomEvent (not remount) to refresh the list after navigating back — Next.js router cache keeps it mounted.
- Room URI is AES-256-CBC encrypted; key is `ROOM_SECRET` env var (must be 32-byte hex = 64 hex chars).
- `serverSelectionTimeoutMS: 8000` in `roomDb.ts` — if a room's MongoDB is unreachable you get a ~8s timeout then 500. Check Atlas IP whitelist (add `0.0.0.0/0` for Vercel).
