# MontraDocs — Panduan Membuat Dokumentasi

Dokumentasi in-app yang dibuka dari ikon help (`?`) di navbar. Seluruh isinya **berbasis data** (file TypeScript), bukan markdown — jadi menambah dokumentasi = menambah satu objek `Collection` ke file data, lalu mendaftarkannya.

> **Aturan utama:** semua teks yang dilihat user **wajib Bahasa Indonesia** (deskripsi, `long`, notes, deskripsi field). Kode, nama tipe, dan key field tetap English.

---

## 1. Struktur file

```
src/components/docs/
├── MongoDocs.tsx      # komponen utama (layout, search, scroll-spy) — jarang disentuh
├── styles.ts          # SEMUA CSS ada di sini (string STYLES), bukan inline
├── types.ts           # interface bersama (Collection, Field, Note, FlowStep, …)
├── helpers.tsx        # f() builder, renderText (wikilink/`code`), highlightJson, copyText
├── components.tsx     # komponen presentasi (SchemaTable, Callout, FlowChart, DocImage, OverviewPanel, …)
└── data/
    ├── index.ts       # SECTIONS, CUSTOM_PAGES, COLLECTIONS (merge), CHILD_OF, ANCHORS, depthOf
    ├── workflows.ts   # collection dengan section "Workflows"
    ├── reports.ts     # section "Reports"
    ├── masterdata.ts  # section "Masterdata"
    ├── replacer.ts    # number_ai
    ├── replacers.ts   # semua halaman replacer (rp_*, field_reference, replacer_syntax)
    ├── fieldtypes.ts  # tiap FORM field type + recursive_fields/numeric_fields
    └── etc.ts         # section "ETC"
```

Gambar dokumentasi: taruh di `public/docs/`, lihat [`public/docs/README.md`](../../../public/docs/README.md).

---

## 2. Cara menambah satu halaman collection (paling umum)

Misal mau menambah collection `myfeature` di section **Reports**.

### Langkah 1 — Tambah objek `Collection` di file section-nya

Buka `data/reports.ts`, tambahkan entry ke object yang di-export:

```ts
myfeature: {
    section: "Reports",                       // harus = label section (lihat SECTIONS di index.ts)
    description: "Penjelasan singkat satu kalimat (teks polos, TANPA wikilink/`code`).",
    long:
        "Paragraf pertama overview.\n\n" +     // pisahkan paragraf dengan \n\n
        "Paragraf kedua. Boleh pakai [[reports|Report]] dan `code`.",
    meta: { documents: "—", indexed: true },
    notes: [
        { kind: "note", text: "Catatan. Boleh `code` dan [[wikilink]]." },
        { kind: "warn", text: "Peringatan penting." },
        { kind: "tip", text: "Tips." },
    ],
    flow: [                                     // OPSIONAL — diagram alur ke samping
        { title: "Langkah 1", detail: "Detail `code`." },
        { title: "Langkah 2", detail: "Detail." },
    ],
    fields: [
        f("_id", "objectid", true, "Unique document identifier."),
        f("key", "string", true, "Deskripsi.", { eg: { key: "contoh" } }),
        f("nested", "object", false, "Object induk."),
        f("child", "string", false, "Field di dalam `nested`.", { depth: 1 }),  // depth = indentasi
    ],
    example: {                                  // ditampilkan sebagai JSON (pakai object JS biasa)
        _id: "650000000000000000000000",       // ObjectId → tulis sebagai string
        key: "contoh",
    },
    indexes: [
        { name: "key_1", keys: ["key"], unique: true },
    ],
    relations: [
        { field: "key", to: "reports", kind: "references" },   // `to` = id halaman lain (jadi link)
    ],
},
```

### Langkah 2 — Daftarkan di `data/index.ts`

Tambahkan id-nya ke `collections` pada section yang sesuai di `SECTIONS`:

```ts
{ id: "Reports", label: "Reports", icon: BarChart3, collections: ["reports", "countindex", /* … */ "myfeature"] },
```

Selesai. `COLLECTIONS` sudah otomatis menggabungkan semua file lewat spread, jadi tidak perlu edit lain (selama file section-nya sudah di-import di `index.ts`).

---

## 3. Bentuk `Collection` (lihat `types.ts`)

| Field | Wajib | Keterangan |
|---|---|---|
| `section` | ✅ | Harus sama dengan `label` section di `SECTIONS`. |
| `description` | ✅ | Satu kalimat, **teks polos** (dirender mentah — jangan pakai `[[...]]`/`` `code` ``). |
| `long` | ✅ | Overview. Multi-paragraf dengan `\n\n`. Mendukung wikilink & `code`. |
| `meta` | ✅ | `{ documents: string, indexed: boolean }` → tampil sebagai chip. |
| `notes` | ✅ | Array callout. Boleh `[]`. |
| `flow` | — | Array `{ title, detail? }` → FlowChart horizontal. |
| `fields` | ✅ | Schema. **Jika `[]`, section Schema otomatis disembunyikan.** |
| `example` | ✅ | Object/array JS → ditampilkan sebagai JSON. |
| `example2..4` + `exampleNLabel` | — | Contoh tambahan. |
| `indexes` | ✅ | `{ name, keys[], unique, note? }[]`. |
| `relations` | ✅ | `{ field, to, kind }[]`. `to` = id halaman → jadi link klik. |

---

## 4. Helper `f()` untuk field schema

```ts
f(name, kind, required, description, extra?)
```

- `kind`: `"objectid" | "string" | "number" | "boolean" | "date" | "array" | "object"`
- `extra` (opsional):
  - `depth: number` — indentasi nested (1, 2, 3…). Field anak diletakkan tepat di bawah induknya.
  - `enumValues: string[]` — tampil sebagai chip enum. Jika nilainya = id halaman, otomatis jadi link.
  - `of: string` — tipe elemen array, mis. `{ of: "string" }` → `array<string>`.
  - `eg: unknown` — contoh per-field (muncul di ikon mata 👁).
  - `group: string` — divider pengelompok di tabel (set di field pertama tiap grup).

```ts
f("type", "string", true, "Tipe field.", { enumValues: ["TEXT", "RADIO"] }),
f("tags", "array", false, "Daftar tag.", { of: "string", eg: { tags: ["a", "b"] } }),
f("_id", "objectid", true, "ID.", { group: "Identitas" }),
```

---

## 5. Teks kaya: wikilink & inline code

Dipakai di `long`, `notes[].text`, `flow[].title/detail`, dan `description` field (lewat `renderText`):

- `` `code` `` → chip kode inline.
- `[[id]]` → link ke halaman `id`, teks = id.
- `[[id|Label]]` → link ke `id`, teks = `Label`.

> `description` collection **TIDAK** lewat `renderText` → di situ jangan pakai `[[...]]`/`` `code` `` (akan tampil mentah).

---

## 6. Halaman anak (indentasi sidebar)

Untuk membuat satu halaman tampil **menjorok** di bawah induknya (mis. `countindex` di bawah `reports`), tambahkan ke `CHILD_OF` di `index.ts`:

```ts
export const CHILD_OF: Record<string, string> = { /* … */, myfeature: "reports" }
```

`depthOf()` menelusuri rantai ini untuk menentukan kedalaman indentasi.

---

## 7. Section → file

Tiap section punya file `data/<section>.ts` yang mengekspor `Record<string, Collection>`. `index.ts` meng-import dan spread semuanya ke `COLLECTIONS`.

**Aturan:** sebuah collection sebaiknya hidup di file yang cocok dengan `section`-nya. Kalau satu file mulai terlalu panjang atau topiknya berbeda, **pecah jadi file baru** (mis. `replacers.ts` dipisah dari `replacer.ts`). Jangan menumpuk semua di satu file, dan jangan menaruh data collection inline di `MongoDocs.tsx`.

Untuk daftar id yang banyak & berpola (field type, replacer), bangun secara programatik agar tidak manual:

```ts
const REPLACER_IDS = Object.keys(replacersCollections)
// SECTIONS: collections: ["replacer_overview", ...REPLACER_IDS]
// CHILD_OF: ...Object.fromEntries(REPLACER_IDS.map((id) => [id, "replacer_overview"]))
```

---

## 8. Gambar (`DocImage`)

1. Taruh file di `public/docs/`, mis. `public/docs/fitur-1.png`.
2. Panggil komponen (referensi path absolut dari `public/`):

```tsx
<DocImage src="/docs/fitur-1.png" alt="Deskripsi" caption="Keterangan gambar." width={520} />
```

Otomatis: border, caption, dan **klik-untuk-zoom** (lightbox). `width` opsional. Dipakai pada custom page (lihat §9). Untuk langkah bernomor, bungkus dengan `<ol className="doc-steps">…</ol>`.

---

## 9. Custom page (bukan schema collection)

Halaman yang isinya bebas (bukan tabel schema), mis. `restart_jar` dan `replacer_overview`.

1. Buat komponen panel di `components.tsx` (pakai `SectionHeading`, `Callout`, `DocImage`, dll. — jangan inline CSS).
2. Daftarkan id-nya ke `CUSTOM_PAGES` di `index.ts`.
3. Tambahkan id ke `collections` section terkait di `SECTIONS`.
4. Sambungkan rendering-nya di `MongoDocs.tsx` (cabang `CUSTOM_PAGES.has(activeId)`).

Custom page tidak butuh entry di `COLLECTIONS`.

---

## 10. Aturan kualitas (wajib)

1. **Bahasa Indonesia** untuk semua teks user-facing; formal & ramah pemula.
2. **CSS hanya di `styles.ts`** — tidak ada inline style baru di komponen.
3. **Data collection di `data/<section>.ts`** — split per section, pecah lagi bila kepanjangan.
4. **Reuse komponen** — kalau blok visual dipakai >1×, ekstrak ke `components.tsx` (`Callout`, `FlowChart`, `DocImage`, `SchemaTable`, dll.), jangan copy-paste markup.

---

## 11. Checklist menambah halaman

- [ ] Objek `Collection` ditulis di `data/<section>.ts` (Bahasa Indonesia).
- [ ] `description` teks polos; `long`/notes boleh wikilink & `code`.
- [ ] Id didaftarkan di `SECTIONS` (`index.ts`).
- [ ] Jika halaman anak: tambahkan ke `CHILD_OF`.
- [ ] Gambar (bila ada) di `public/docs/` + dipanggil via `DocImage`.
- [ ] `npm run lint` bersih.
```
