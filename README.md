# MongoDB Editor

Editor dokumen MongoDB kolaboratif berbasis **Next.js**. Pengguna bergabung ke sebuah **room** (juga disebut *cluster*), di mana setiap room terhubung ke database MongoDB terpisah (URI disimpan terenkripsi di database inti). Fitur utama: CRUD dokumen, auto-save draft, audit log dengan rollback, visualisasi chart, dan pembaruan real-time via SSE.

> Dokumen ini menjelaskan **struktur file** dan **fungsi tiap file** secara menyeluruh. Untuk aturan pengembangan & invariant inti, lihat [`CLAUDE.md`](CLAUDE.md).

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Arsitektur Singkat](#arsitektur-singkat)
- [Struktur File Lengkap](#struktur-file-lengkap)
  - [File Konfigurasi Root](#file-konfigurasi-root)
  - [`src/app` — Halaman & Layout](#srcapp--halaman--layout)
  - [`src/app/api` — API Routes](#srcappapi--api-routes)
  - [`src/components` — Komponen UI](#srccomponents--komponen-ui)
  - [`src/hooks` — React Hooks](#srchooks--react-hooks)
  - [`src/lib` — Library / Utilitas](#srclib--library--utilitas)
  - [`public` — Aset Statis](#public--aset-statis)

---

## Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | MongoDB 5 (dua koneksi: core DB + room DB) |
| UI | TailwindCSS v4, Radix UI, komponen shadcn |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Tabel | TanStack Table (`@tanstack/react-table`) |
| Chart / Flow | React Flow (`@xyflow/react`) |
| BSON | `bson` (selalu pakai `EJSON`, bukan `JSON` biasa) |
| Auth | JWT (`jsonwebtoken`) + OAuth (Google/GitHub) |
| Password | `bcryptjs` |
| Real-time | Server-Sent Events (SSE) |
| Import/Export | `xlsx` |
| Diff | `jsondiffpatch`, `fast-json-patch` |

## Getting Started

```bash
npm install       # instal dependency
npm run dev       # dev server (Turbopack) di http://localhost:3000
npm run build     # build produksi
npm run start     # jalankan hasil build produksi
npm run lint      # ESLint
```

Untuk MongoDB lokal, tersedia [`docker-compose.yml`](docker-compose.yml).

## Environment Variables

Buat file `.env` (contoh ada di [`.env.example`](.env.example)):

```
MONGO_LOCAL_URI=       # URI MongoDB inti (database workflowbuilder_core)
JWT_SECRET=            # secret untuk menandatangani JWT
ROOM_SECRET=           # kunci hex 32-byte (64 char) untuk enkripsi AES-256-CBC URI room
GOOGLE_CLIENT_ID=      # opsional — OAuth Google
GOOGLE_CLIENT_SECRET=  # opsional
GITHUB_CLIENT_ID=      # opsional — OAuth GitHub
GITHUB_CLIENT_SECRET=  # opsional
```

## Arsitektur Singkat

- **Dua koneksi MongoDB:**
  - `workflowbuilder_core` — menyimpan `rooms`, `users`, `audit_logs`, `backups`, `charts`. Diakses via [`src/lib/mongodb.ts`](src/lib/mongodb.ts).
  - **Room DB** — database milik tiap room; URI-nya didekripsi saat runtime. Diakses via [`src/lib/roomDb.ts`](src/lib/roomDb.ts).
- **Home sebagai SPA:** [`src/app/page.tsx`](src/app/page.tsx) menampilkan navbar + daftar collection + tabel dokumen, dan berpindah "view" (collections / audit / charts / drafts) tanpa full reload. Halaman lama seperti `/chart` dan `/drafts` hanya me-redirect ke SPA.
- **Real-time:** setiap mutasi memanggil `broadcast(...)` pada SSE stream per-collection; klien lain menerima event dan me-refetch.
- **Audit + backup:** setiap create/update/delete menulis entri ke `audit_logs`; update/delete juga menyimpan snapshot ke `backups` sehingga bisa di-rollback.

---

## Struktur File Lengkap

### File Konfigurasi Root

| File | Fungsi |
|------|--------|
| [`package.json`](package.json) | Metadata proyek, script npm (`dev`/`build`/`start`/`lint`), dan daftar dependency. |
| [`next.config.ts`](next.config.ts) | Konfigurasi Next.js. |
| [`tsconfig.json`](tsconfig.json) | Konfigurasi TypeScript, termasuk alias path `@/*` → `src/*`. |
| [`eslint.config.mjs`](eslint.config.mjs) | Aturan ESLint (memakai `eslint-config-next`). |
| [`postcss.config.mjs`](postcss.config.mjs) | Konfigurasi PostCSS untuk TailwindCSS v4. |
| [`components.json`](components.json) | Konfigurasi shadcn/ui (lokasi & alias komponen). |
| [`docker-compose.yml`](docker-compose.yml) | Definisi service MongoDB untuk pengembangan lokal. |
| [`.env.example`](.env.example) | Template environment variable yang dibutuhkan. |
| [`CLAUDE.md`](CLAUDE.md) | Panduan arsitektur & invariant inti untuk kontributor/agen. |
| [`EXCEL_TEMPLATE_GUIDE.md`](EXCEL_TEMPLATE_GUIDE.md) | Panduan template Excel untuk import/export data. |

### `src/app` — Halaman & Layout

Menggunakan **App Router** Next.js. Setiap folder = route.

| File | Fungsi |
|------|--------|
| [`layout.tsx`](src/app/layout.tsx) | Root layout: memuat font Geist, `globals.css`, dan membungkus aplikasi dengan `ErrorProvider`. |
| [`globals.css`](src/app/globals.css) | Style global + variabel tema Tailwind. |
| [`page.tsx`](src/app/page.tsx) | **Home (SPA utama).** Mengatur state view (`collections`/`audit`/`charts`/`drafts`), room aktif, collection aktif, dan mode editing. Merender navbar, `CollectionList`, `DocumentTable`, `DocumentEditor`, `AuditViewer`, `ChartListView`, dan `DraftsView` secara inline. |
| [`login/page.tsx`](src/app/login/page.tsx) | Halaman login (email/password + tombol OAuth). |
| [`register/page.tsx`](src/app/register/page.tsx) | Halaman registrasi akun baru. |
| [`auth/callback/page.tsx`](src/app/auth/callback/page.tsx) | Menangani hasil redirect OAuth: mengambil token dari URL, menyimpan ke `localStorage`, lalu mengarahkan ke home. |
| [`edit/page.tsx`](src/app/edit/page.tsx) | Route `/edit` — membungkus `EditPageClient` dalam `<Suspense>`. |
| [`edit/EditPageClient.tsx`](src/app/edit/EditPageClient.tsx) | Editor Monaco full-page (mode "new" & "edit") yang dibuka di tab baru; membaca dokumen dari `localStorage` (`edit_doc`), auto-save draft, lalu navigasi balik ke home setelah save/close. |
| [`docs/page.tsx`](src/app/docs/page.tsx) | Route `/docs` — merender dokumentasi in-app (`MongoDocs`). |
| [`chart/page.tsx`](src/app/chart/page.tsx) | Redirect ke home SPA (chart kini inline). |
| [`chart/[id]/page.tsx`](src/app/chart/[id]/page.tsx) | Halaman detail/edit satu chart. |
| [`drafts/page.tsx`](src/app/drafts/page.tsx) | Redirect ke home SPA (drafts kini inline). |
| [`favicon.ico`](src/app/favicon.ico) | Ikon situs. |

### `src/app/api` — API Routes

Semua route memverifikasi JWT lewat fungsi lokal `getUser(req)` (mengembalikan `null` → HTTP 401). Akses room DB selalu lewat `getRoomDb(roomId)`.

**Autentikasi**

| Route | Method | Fungsi |
|-------|--------|--------|
| [`api/auth/register/route.ts`](src/app/api/auth/register/route.ts) | `POST` | Registrasi user baru (hash password dengan bcrypt, email dinormalisasi). |
| [`api/auth/login/route.ts`](src/app/api/auth/login/route.ts) | `POST` | Login email/password, mengembalikan JWT. |
| [`api/auth/oauth/[provider]/route.ts`](src/app/api/auth/oauth/[provider]/route.ts) | `GET` | Memulai alur OAuth: redirect ke halaman authorize provider (Google/GitHub). |
| [`api/auth/oauth/[provider]/callback/route.ts`](src/app/api/auth/oauth/[provider]/callback/route.ts) | `GET` | Callback OAuth: tukar code → token, ambil email terverifikasi, buat/temukan user, terbitkan JWT yang sama seperti login biasa. |

**Rooms (Clusters) & Membership**

| Route | Method | Fungsi |
|-------|--------|--------|
| [`api/rooms/route.ts`](src/app/api/rooms/route.ts) | `GET`, `POST` | List room milik user / buat room baru (mengenkripsi URI MongoDB dengan `ROOM_SECRET`). |
| [`api/rooms/[roomId]/route.ts`](src/app/api/rooms/[roomId]/route.ts) | `GET`, `PATCH`, `DELETE` | Ambil detail, ubah, atau hapus satu room. |
| [`api/rooms/[roomId]/members/route.ts`](src/app/api/rooms/[roomId]/members/route.ts) | `GET`, `PATCH`, `DELETE` | List anggota, ubah peran (role), atau keluarkan anggota. |
| [`api/rooms/[roomId]/invite/route.ts`](src/app/api/rooms/[roomId]/invite/route.ts) | `GET`, `POST` | Cek keberadaan user berdasarkan email & kirim undangan bergabung ke room. |

**Collections & Documents (per Room)**

| Route | Method | Fungsi |
|-------|--------|--------|
| [`api/rooms/[roomId]/collections/route.ts`](src/app/api/rooms/[roomId]/collections/route.ts) | `GET`, `POST` | List collection (+jumlah dokumen) / buat collection baru. |
| [`.../collections/[collectionName]/route.ts`](src/app/api/rooms/[roomId]/collections/[collectionName]/route.ts) | `GET`, `POST`, `PATCH`, `DELETE` | **Inti dokumen:** `GET` = query dokumen dengan `?filter=&sort=&page=&limit=` (EJSON), `POST` = insert dokumen, `PATCH` = rename collection, `DELETE` = drop collection. Semua menulis audit log & backup. |
| [`.../collections/[collectionName]/[documentId]/route.ts`](src/app/api/rooms/[roomId]/collections/[collectionName]/[documentId]/route.ts) | `PUT`, `DELETE` | Update / hapus satu dokumen (coba `ObjectId` dulu, fallback ke `_id` string). Menulis audit log + backup. |
| [`.../collections/[collectionName]/bulk/route.ts`](src/app/api/rooms/[roomId]/collections/[collectionName]/bulk/route.ts) | `POST` | Operasi massal dari Query mode: `deleteOne`/`deleteMany`/`updateOne`/`updateMany`. Selalu menulis audit log. |
| [`.../collections/[collectionName]/clone/route.ts`](src/app/api/rooms/[roomId]/collections/[collectionName]/clone/route.ts) | `POST` | Menggandakan (clone) sebuah collection. |
| [`.../collections/[collectionName]/stream/route.ts`](src/app/api/rooms/[roomId]/collections/[collectionName]/stream/route.ts) | `GET` | Endpoint SSE: mendaftarkan klien untuk menerima event perubahan collection. |
| [`.../collections/[collectionName]/stream/broadcaster.ts`](src/app/api/rooms/[roomId]/collections/[collectionName]/stream/broadcaster.ts) | — | Helper in-memory: `broadcast(event)`, `addClient()`, `removeClient()` untuk menyiarkan event ke semua klien SSE. |

**Audit & Charts**

| Route | Method | Fungsi |
|-------|--------|--------|
| [`api/audit/route.ts`](src/app/api/audit/route.ts) | `GET` | Ambil daftar audit log (bisa difilter per room/collection). |
| [`api/audit/[logId]/rollback/route.ts`](src/app/api/audit/[logId]/rollback/route.ts) | `POST` | Rollback sebuah perubahan menggunakan snapshot `before` dari audit log. |
| [`api/charts/route.ts`](src/app/api/charts/route.ts) | `GET`, `POST` | List / buat chart. |
| [`api/charts/[id]/route.ts`](src/app/api/charts/[id]/route.ts) | `GET`, `PUT`, `DELETE` | Ambil / ubah / hapus satu chart. |

### `src/components` — Komponen UI

#### `components/` (root)

| File | Fungsi |
|------|--------|
| [`navbar.tsx`](src/components/navbar.tsx) | Navbar utama: pemilih room, pindah view, tombol tema, ikon bantuan/docs. |
| [`Breadcrumb.tsx`](src/components/Breadcrumb.tsx) | Breadcrumb navigasi (room → collection). |
| [`AuditViewer.tsx`](src/components/AuditViewer.tsx) | Tampilan daftar audit log dengan aksi rollback. |
| [`AuditDiffModal.tsx`](src/components/AuditDiffModal.tsx) | Modal yang menampilkan diff `before`/`after` sebuah audit log. |
| [`JsonEditModal.tsx`](src/components/JsonEditModal.tsx) | Modal editor JSON generik. |

#### `components/auth/`

| File | Fungsi |
|------|--------|
| [`AuthShell.tsx`](src/components/auth/AuthShell.tsx) | Kerangka layout halaman auth (login/register). |
| [`BrandPanel.tsx`](src/components/auth/BrandPanel.tsx) | Panel branding di sisi halaman auth (contoh query bergaya syntax-highlight). |
| [`AuthIcons.tsx`](src/components/auth/AuthIcons.tsx) | Ikon SVG provider (GitHub, Google, dll.). |
| [`montra.module.css`](src/components/auth/montra.module.css) | Style khusus halaman auth/branding. |

#### `components/rooms/`

| File | Fungsi |
|------|--------|
| [`useRooms.ts`](src/components/rooms/useRooms.ts) | Hook: memuat & mengelola daftar room (fetch, state loading). |
| [`CreateRoomDialog.tsx`](src/components/rooms/CreateRoomDialog.tsx) | Dialog membuat room baru (input URI MongoDB). |
| [`EditRoomDialog.tsx`](src/components/rooms/EditRoomDialog.tsx) | Dialog mengubah detail room. |
| [`ManageClustersModal.tsx`](src/components/rooms/ManageClustersModal.tsx) | Modal mengelola daftar cluster/room (tambah, ubah, hapus, pilih). |
| [`RoomMembersModal.tsx`](src/components/rooms/RoomMembersModal.tsx) | Modal mengelola anggota room & peran mereka. |
| [`InviteUserDialog.tsx`](src/components/rooms/InviteUserDialog.tsx) | Dialog mengundang user (lookup email ala GitHub). |
| [`InviteStatusDialog.tsx`](src/components/rooms/InviteStatusDialog.tsx) | Dialog menampilkan status undangan yang terkirim. |

#### `components/collections/`

| File | Fungsi |
|------|--------|
| [`CollectionList.tsx`](src/components/collections/CollectionList.tsx) | Daftar collection dalam room (dengan jumlah dokumen, pencarian, aksi buat). |
| [`CollectionContextMenu.tsx`](src/components/collections/CollectionContextMenu.tsx) | Menu klik-kanan collection (rename, clone, drop, dll.). |

#### `components/documents/`

Inti fitur editor dokumen.

| File | Fungsi |
|------|--------|
| [`DocumentTable.tsx`](src/components/documents/DocumentTable.tsx) | Tabel dokumen (TanStack Table). Punya mode **Filter** (GUI) & **Query** (EJSON mentah), paginasi, dan aksi baris. |
| [`useDocuments.tsx`](src/components/documents/useDocuments.tsx) | Hook data tabel: `fetchData()`, `queryData(filter)`, langganan SSE, dan refresh via event `mongoedit:saved` + `storage`. |
| [`DocumentEditor.tsx`](src/components/documents/DocumentEditor.tsx) | Editor dokumen (inline). Auto-save draft (debounce 500ms), simpan/hapus draft, tulis via API, lalu broadcast refresh. |
| [`DocumentContextMenu.tsx`](src/components/documents/DocumentContextMenu.tsx) | Menu klik-kanan baris dokumen (Update, Edit in New Tab, Delete, View, Add, Refresh) — dibatasi oleh `userRole`. |
| [`FilterBuilderModal.tsx`](src/components/documents/FilterBuilderModal.tsx) | Modal builder filter: mode **Visual** (kondisi field/operator/value dengan grup AND/OR, field bisa diketik manual) & mode **Query** (editor shell dengan syntax highlight). Menghasilkan filter EJSON, bisa langsung Apply / Delete matching. |
| [`filterBuilder.module.css`](src/components/documents/filterBuilder.module.css) | Style untuk `FilterBuilderModal`. |
| [`JsonViewerModal.tsx`](src/components/documents/JsonViewerModal.tsx) | Modal melihat satu dokumen dalam format JSON/EJSON (read-only). |

#### `components/chart/` & `components/charts/`

| File | Fungsi |
|------|--------|
| [`chart/ChartBuilder.tsx`](src/components/chart/ChartBuilder.tsx) | Builder chart/flow utama (kanvas + sidebar + panel). |
| [`chart/ChartCanvas.tsx`](src/components/chart/ChartCanvas.tsx) | Kanvas React Flow (background, controls, node). |
| [`chart/ChartNode.tsx`](src/components/chart/ChartNode.tsx) | Definisi node kustom pada kanvas. |
| [`chart/ChartSidebar.tsx`](src/components/chart/ChartSidebar.tsx) | Sidebar daftar tipe node yang bisa di-drag ke kanvas. |
| [`chart/NodeFieldsPanel.tsx`](src/components/chart/NodeFieldsPanel.tsx) | Panel mengedit field/property node terpilih. |
| [`charts/ChartListView.tsx`](src/components/charts/ChartListView.tsx) | Tampilan daftar chart tersimpan (view "charts" di home). |

#### `components/drafts/`

| File | Fungsi |
|------|--------|
| [`DraftsView.tsx`](src/components/drafts/DraftsView.tsx) | Daftar draft yang tersimpan di `localStorage` (add & edit draft), dengan aksi lanjutkan/hapus. |

#### `components/docs/` — Dokumentasi In-App (MontraDocs)

Dokumentasi yang tampil dari ikon bantuan (`?`) di navbar. **Konten wajib Bahasa Indonesia.** Style, tipe, helper, data, dan komponen dipisah per file (lihat aturan di [`CLAUDE.md`](CLAUDE.md) & [`src/components/docs/README.md`](src/components/docs/README.md)).

| File | Fungsi |
|------|--------|
| [`MongoDocs.tsx`](src/components/docs/MongoDocs.tsx) | Komponen utama docs: state, layout, pencarian, scroll-spy (overlay full-screen). |
| [`styles.ts`](src/components/docs/styles.ts) | Seluruh string CSS docs (`STYLES`) — tidak ada CSS inline di komponen. |
| [`types.ts`](src/components/docs/types.ts) | Interface bersama: `Field`, `Collection`, `SectionDef`, `SearchItem`, dll. |
| [`helpers.tsx`](src/components/docs/helpers.tsx) | Helper: `f()` (builder field), `renderText`, `highlightJson`, `copyText`. |
| [`components.tsx`](src/components/docs/components.tsx) | Komponen presentasional: `TypeCell`, `ReqCell`, `SchemaTable`, `CodeBlock`, `Callout`, `RestartJarPanel`, dll. |
| [`data/index.ts`](src/components/docs/data/index.ts) | Menggabungkan semua data section jadi `COLLECTIONS`, plus `SECTIONS`, `ALL_IDS`, `CHILD_OF`, `ANCHORS`. |
| [`data/workflows.ts`](src/components/docs/data/workflows.ts) | Data collection section **Workflows**. |
| [`data/reports.ts`](src/components/docs/data/reports.ts) | Data collection section **Reports**. |
| [`data/masterdata.ts`](src/components/docs/data/masterdata.ts) | Data collection section **Masterdata**. |
| [`data/etc.ts`](src/components/docs/data/etc.ts) | Data collection section **ETC** (mis. schema Selection). |
| [`data/fieldtypes.ts`](src/components/docs/data/fieldtypes.ts) | Satu halaman per tipe field FORM (`FieldType`), berbagi `baseFields`. |
| [`data/replacer.ts`](src/components/docs/data/replacer.ts) | Data collection replacer (mis. `number_ai`). |
| [`data/replacers.ts`](src/components/docs/data/replacers.ts) | Satu halaman per replacer prefix (`${PREFIX\|...}`) + aturan sintaksnya. |
| [`README.md`](src/components/docs/README.md) | Panduan menambah/mengubah konten docs. |

#### `components/ui/` — Primitives (shadcn / Radix)

Komponen dasar reusable. Umumnya thin wrapper di atas Radix UI + varian Tailwind.

| File | Komponen |
|------|----------|
| [`button.tsx`](src/components/ui/button.tsx) | Button (dengan varian via `class-variance-authority`). |
| [`input.tsx`](src/components/ui/input.tsx) | Input teks. |
| [`label.tsx`](src/components/ui/label.tsx) | Label form. |
| [`card.tsx`](src/components/ui/card.tsx) | Card + sub-komponen (header/content/footer). |
| [`dialog.tsx`](src/components/ui/dialog.tsx) | Dialog modal. |
| [`sheet.tsx`](src/components/ui/sheet.tsx) | Panel geser (side sheet). |
| [`popover.tsx`](src/components/ui/popover.tsx) | Popover. |
| [`dropdown-menu.tsx`](src/components/ui/dropdown-menu.tsx) | Menu dropdown. |
| [`navigation-menu.tsx`](src/components/ui/navigation-menu.tsx) | Menu navigasi. |
| [`select.tsx`](src/components/ui/select.tsx) | Select/dropdown pilihan. |
| [`command.tsx`](src/components/ui/command.tsx) | Command palette (`cmdk`). |
| [`table.tsx`](src/components/ui/table.tsx) | Elemen tabel dasar. |
| [`tooltip.tsx`](src/components/ui/tooltip.tsx) | Tooltip. |
| [`alert.tsx`](src/components/ui/alert.tsx) | Kotak alert. |
| [`collapsible.tsx`](src/components/ui/collapsible.tsx) | Konten yang bisa diciutkan. |
| [`scroll-area.tsx`](src/components/ui/scroll-area.tsx) | Area scroll ber-styling. |
| [`separator.tsx`](src/components/ui/separator.tsx) | Garis pemisah. |
| [`skeleton.tsx`](src/components/ui/skeleton.tsx) | Placeholder loading. |
| [`ConfirmDialog.tsx`](src/components/ui/ConfirmDialog.tsx) | Dialog konfirmasi aksi (mis. sebelum operasi write/delete). |

### `src/hooks` — React Hooks

| File | Fungsi |
|------|--------|
| [`useTheme.ts`](src/hooks/useTheme.ts) | Baca/tulis tema (`light`/`dark`) ke `localStorage` (key `mongoedit:theme`, default `light`). |

### `src/lib` — Library / Utilitas

| File | Fungsi |
|------|--------|
| [`mongodb.ts`](src/lib/mongodb.ts) | Singleton `MongoClient` untuk core DB (`clientPromise`), di-cache di `global` agar tidak reconnect saat hot-reload. |
| [`roomDb.ts`](src/lib/roomDb.ts) | `getRoomDb(roomId)`: ambil room dari core DB, dekripsi URI (AES-256-CBC via `ROOM_SECRET`), konek & cache koneksi (dengan ping-check + auto-reconnect, timeout 8s). |
| [`auth.ts`](src/lib/auth.ts) | `getUserRole()`: decode JWT dari `localStorage` di sisi client untuk membaca role. |
| [`ejsonShell.ts`](src/lib/ejsonShell.ts) | Helper EJSON ↔ notasi shell Mongo: `toShellString()` (render `ObjectId()`/`ISODate()`/`NumberLong()` dll.), `parseShellStringToEjson()`, `safeParse()`, `getEjsonIdString()`. |
| [`mongoUri.ts`](src/lib/mongoUri.ts) | `parseMongoUri()` & `buildMongoUri()`: konversi antara string URI dan objek konfigurasi (host, port, kredensial, authDb). |
| [`oauth.ts`](src/lib/oauth.ts) | Alur OAuth authorization-code: `getProviderConfig()`, `exchangeCodeForToken()`, `fetchVerifiedEmail()` (Google & GitHub), `isProvider()`. |
| [`email.ts`](src/lib/email.ts) | `normalizeEmail()`: bentuk kanonik email (trim + lowercase) agar login/register/OAuth/invite konsisten. |
| [`errorContext.tsx`](src/lib/errorContext.tsx) | `ErrorProvider` + `useError()`: menampilkan modal error global & menangkap `unhandledrejection`. |
| [`utils.ts`](src/lib/utils.ts) | `cn()`: gabung className Tailwind (`clsx` + `tailwind-merge`). |

### `public` — Aset Statis

| File | Fungsi |
|------|--------|
| [`public/docs/*`](public/docs/) | Gambar/screenshot yang dipakai dokumentasi in-app (MontraDocs). |
| [`public/EXCEL_TEMPLATE_GUIDE.md`](public/EXCEL_TEMPLATE_GUIDE.md), [`QUICK_TEST.md`](public/QUICK_TEST.md), [`SAMPLE_DATA.md`](public/SAMPLE_DATA.md) | Panduan & data contoh yang dapat diakses publik. |
| `public/*.svg` | Ikon bawaan (`file`, `globe`, `next`, `vercel`, `window`). |

---

## Catatan Penting (Invariant)

Empat perilaku yang **harus selalu terjaga** saat menyentuh mutasi, editor, atau tabel (detail di [`CLAUDE.md`](CLAUDE.md)):

1. **Setiap create/update/delete menulis audit log** ke `workflowbuilder_core.audit_logs` (update/delete juga menulis `backups`).
2. **Setiap edit/add auto-save draft** ke `localStorage` (hanya saat konten benar-benar berubah).
3. **Save atau discard menghapus draft** yang bersangkutan.
4. **Setiap mutasi me-refresh collection** lewat tiga kanal: `mongoedit:saved` CustomEvent (tab sama), `storage` event (tab lain), dan `broadcast()` SSE (klien lain).

## Aturan BSON

Selalu gunakan `EJSON`, **jangan** `JSON.parse`/`JSON.stringify` untuk dokumen MongoDB. Untuk menampilkan: `JSON.stringify(EJSON.serialize(doc, { relaxed: false }), null, 2)`. Di API: `EJSON.deserialize(payload, { relaxed: false })` saat menyimpan, `EJSON.serialize(doc, { relaxed: false })` saat merespons.
