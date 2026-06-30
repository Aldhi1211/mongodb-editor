import { f } from "../helpers"
import type { Collection, Field, Note } from "../types"
import { selectionFields } from "./etc"

/* One page per FORM field `type` (FieldType constants). Every type shares the
   Base Field schema (`baseFields`) below; add type-specific fields on top of it
   per type as docs are written. */

/** Base Field — properties shared by every FORM field type. */
const baseFields: Field[] = [
    // identitas & label
    f("key", "string", true, "ID unik field di dalam form.", { eg: { key: "customer_name" } }),
    f("label", "string", true, "Label/judul field yang ditampilkan.", { eg: { label: "Nama Customer" } }),
    f("type", "string", true, "Tipe field (`text`, `selection`, `number`, `date`, dll).", { eg: { type: "TEXT" } }),
    f("order", "number", true, "Urutan field di dalam form (0, 1, 2, ...). Wajib diisi agar field terurut sesuai keinginan saat dipakai di form. Apabila tidak diisi, pada history form field akan otomatis diurutkan berdasarkan abjad dari `label`-nya.", { eg: { order: 1 } }),
    // visibility & display
    f("isVisible", "boolean", false, "Menentukan field tampil atau tersembunyi di form. Apabila tidak diisi, default-nya `true` (field ditampilkan).", { eg: { isVisible: true } }),
    f("isVisibleHistory", "boolean", false, "Tetap menampilkan field di history task meskipun `isVisible` bernilai `false`.", { eg: { isVisibleHistory: false } }),
    f("isHidden", "boolean", false, "Menyembunyikan field (mirip `isVisible = false`). Bedanya, field yang di-set `isHidden` tidak bisa dimunculkan kembali lewat `triggerView`.", { eg: { isHidden: true } }),
    f("unHideInHistory", "boolean", false, "Jika `false` dan value tidak null, maka hide = false (field ditampilkan di history).", { eg: { unHideInHistory: true } }),
    f("isVisibleBV", "boolean", false, "Is Visible Based on Value — field tampil hanya jika ada value.", { eg: { isVisibleBV: true } }),
    f("isHDSV", "boolean", false, "Hidden Don't Submit Value — apabila field dalam keadaan hidden (`hide = true` atau `isVisible = false`), maka value-nya tidak akan dikirim saat submit.", { eg: { isHDSV: true } }),
    f("aggregateShow", "boolean", false, "Menampilkan field di aggregate/ringkasan.", { eg: { aggregateShow: true } }),
    // required & validation
    f("isRequired", "boolean", false, "Menentukan field wajib diisi (`true`/`false`). Apabila tidak diisi, default-nya `true` (field wajib diisi).", { eg: { isRequired: true } }),
    f("validateCDV", "boolean", false, "Validate Calculated Default Value — memvalidasi default value yang di-calculate.", { eg: { validateCDV: true } }),
    // value & default
    f("value", "string", false, "Autofill field dengan nilai hardcode (nilai tetap yang langsung diisikan ke field).", { eg: { value: "PT ABC" } }),
    f("defaultValue", "string", false, "Nilai default jika field kosong. Bisa diisi secara hardcode (langsung string), atau memakai [[replacer_overview|replacer]] untuk mengambil nilai dari field lain.", { eg: { defaultValue: "PT ABC" } }),
    f("isReplace", "boolean", false, "Biasa dipakai ketika FORM di-reject dan task kembali ke form sebelumnya; field dengan `isReplace` wajib diisi ulang di form sebelumnya tersebut.", { eg: { isReplace: true } }),
    // disabled state
    f("isDisabled", "boolean", false, "Field dalam keadaan disabled/read-only.", { eg: { isDisabled: true } }),
    f("disalbeIfValueExist", "boolean", false, "Jika field sudah memiliki value, maka `isDisabled`-nya otomatis menjadi `true` (field di-disable).", { eg: { disalbeIfValueExist: true } }),
    // copy from
    f("copyFrom", "string", false, "Autofill value field ini. Bisa diisi secara hardcode (langsung string, sama seperti `value`), atau memakai [[replacer_overview|replacer]] untuk mengambil dari field lain.", { eg: { copyFrom: "${workflowId.formId.formData.ref_customer}" } }),
    f("isReplaceCF", "boolean", false, "Menjalankan ulang proses `copyFrom` (replace) setiap kali form dimuat (load).", { eg: { isReplaceCF: true } }),
    // trigger / listener (dynamic behavior)
    f("triggerReload", "array", false, "Daftar `key` field (di form yang sama) yang akan di-reload ketika field ini berubah. Cenderung hanya dipakai pada field [[DROPDOWN]], [[CHECKBOX]], dan [[RADIO]], tetapi bisa juga dipakai field lain dengan kondisi tertentu.", { of: "string", eg: { triggerReload: ["product_list"] } }),
    f("triggerOption", "array", false, "Daftar `key` field (di form yang sama) yang opsinya (option) akan di-reload ketika field ini berubah. Cenderung hanya dipakai pada field [[DROPDOWN]], [[CHECKBOX]], dan [[RADIO]], tetapi bisa juga dipakai field lain dengan kondisi tertentu.", { of: "string", eg: { triggerOption: ["key"] } }),
    f("triggerView", "object", false, "Mapping `value → daftar key field`. Key map adalah kemungkinan value dari field ini; isinya berupa daftar `key` field (di form yang sama) yang ditampilkan saat value tersebut cocok. Contoh: `{ \"No\": [\"catatanEnvCleanlines\"] }` — saat value `No`, tampilkan field `catatanEnvCleanlines`. Hanya dipakai pada field [[RADIO]].", { eg: { triggerView: { No: ["catatanEnvCleanlines"] } } }),
    f("triggerFormula", "object", false, "Memicu formula/kalkulasi.", { eg: { triggerFormula: true } }),
    f("vtb", "string", false, "Value Trigger Based — dipakai ketika ada lebih dari satu field ber-`triggerView` di FORM yang sama. Berfungsi untuk menyeleksi field ini akan di-`triggerView` oleh field yang mana. Isinya adalah `key` dari field yang memiliki `triggerView` tersebut.", { eg: { vtb: "key" } }),
    // report & references
    f("reportVariable", "string", false, "Berfungsi seperti `copyFrom` (autofill), tetapi hanya bisa dipakai di report atau `fieldsAfterSubmit`. Jika dipakai di `fieldsAfterSubmit`, hanya untuk field bertype [[ITEM_LIST]], [[FORM_CHILD]], atau [[CARD_LIST]].", { eg: { reportVariable: "${workflowId.formId.formData.ref_customer}" } }),
    f("ref", "object", false, "Autofill value field dari master data (DbDistinctRef). Hanya bekerja jika field ini di-`triggerReload` oleh field lain. Isinya berupa [[selection|Selection]].", { eg: { ref: { reportType: "masterdata", collection: "machine_usage", searchKey: "color_a3", params: { machine_address: "${$.$.formData.alamat}" }, defaultValue: "${NUMBER|0|INTEGER}", isTriggered: false } } }),
    // aggregate & grouping
    f("aggregateLabel", "string", false, "Label untuk aggregate/summary.", { eg: { aggregateLabel: "example aggregate" } }),
    // split task
    f("splitTask", "object", false, "Konfigurasi split task berdasarkan field ini. Hanya bisa digunakan pada field [[ITEM_LIST]], [[CARD_LIST]], atau [[FORM_CHILD]].", { eg: { splitTask: { needSplit: true, splitNextNode: "filegenPO", numberAi: { noPOSplit: "PO-${NUMBERAI|5|po_split}" }, ilDataToMain: ["alamat_supplier", "nama_pic"], validate: "nama_supplier" } } }),
    // special
    f("hide", "boolean", false, "Global hide flag untuk field.", { eg: { hide: true } }),
    // jarang dipakai
    f("triggerMapView", "object", false, "Memicu map view."),
    f("triggerTicketTask", "object", false, "Memicu ticket task."),
    f("triggerAssignmentView", "array", false, "Menentukan field mana yang memicu assignment view.", { of: "string" }),
    f("triggerHide", "object", false, "Mapping `value → daftar field` untuk menyembunyikan field tertentu berdasarkan value."),
    f("hideInTemplate", "boolean", false, "Menyembunyikan field di template."),
    f("hideInFilter", "boolean", false, "Menyembunyikan field di filter."),
]

/** Callout di page Selection field (DROPDOWN/RADIO/CHECKBOX) yang menunjuk ke schema Selection. */
const selectionNote: Note = { kind: "note", text: "Field ini termasuk Selection field, jadi schema [[selection|Selection]] ikut berlaku di sini — property seperti `options`, `reportType`, `uiType`, dll bisa dipakai langsung pada field ini (lihat tabel schema di bawah)." }

/** Callout di page Text field (TEXT/TEXT_AREA/EMAIL/TEXT_NUMBER/TEXT_JSON) yang menunjuk ke schema Text. */
const textNote: Note = { kind: "note", text: "Field ini menggunakan class `Text` yang sama dengan [[TEXT]], [[TEXT_AREA]], [[EMAIL]], [[TEXT_NUMBER]], dan [[TEXT_JSON]]. Properti `placeholder`, `minLength`, dan `maxLength` berlaku di semua tipe tersebut." }

/** Base schema yang dibagi oleh semua Text field (TEXT, TEXT_AREA, EMAIL, TEXT_NUMBER, TEXT_JSON). */
const textFields: Field[] = [
    f("placeholder", "string", false, "Teks bayangan yang ditampilkan saat input kosong. Default `\"\"`.", { eg: { placeholder: "Masukkan teks di sini" } }),
    f("minLength", "number", false, "Panjang karakter minimum yang boleh diinput. Default `0`.", { eg: { minLength: 3 } }),
    f("maxLength", "number", false, "Panjang karakter maksimum yang boleh diinput. Default `999`.", { eg: { maxLength: 100 } }),
]

/** Callout di page Recursive Field (ITEM_LIST/CARD_LIST/FORM_CHILD) yang menunjuk ke schema Recursive Fields. */
const recursiveNote: Note = { kind: "note", text: "Field ini termasuk Recursive Field, sehingga schema [[recursive_fields|Recursive Fields]] ikut berlaku di sini — semua property seperti `title`, `reportType`, `params`, `fields`, dll bisa dipakai langsung pada field ini (lihat tabel schema di bawah)." }

/** Callout di page Numeric field (NUMBER/DECIMAL/CURRENCY) yang menunjuk ke schema Numeric Fields. */
const numericNote: Note = { kind: "note", text: "Field ini termasuk Numeric field, sehingga schema [[numeric_fields|Numeric Fields]] ikut berlaku di sini — property seperti `decimalCount`, `min`, `max`, `thousandSep`, `formula`, dll bisa dipakai langsung pada field ini (lihat tabel schema di bawah)." }

/** Base schema yang dibagi oleh semua Numeric field (NUMBER, DECIMAL, CURRENCY). */
export const numericFields: Field[] = [
    f("decimalCount", "number", false, "Jumlah digit desimal yang ditampilkan. Default `0` (tanpa desimal).", { eg: { decimalCount: 2 } }),
    f("min", "number", false, "Nilai minimum yang bisa diinput. Default `0`.", { eg: { min: 0 } }),
    f("max", "number", false, "Nilai maksimum yang bisa diinput. Default tidak terbatas.", { eg: { max: 999999999 } }),
    f("unit", "string", false, "Satuan yang ditampilkan di samping nilai (contoh: `\"Rp\"`, `\"kg\"`, `\"Per Bulan\"`).", { eg: { unit: "Rp" } }),
    f("placeholder", "string", false, "Teks placeholder sebelum user mengisi.", { eg: { placeholder: "Masukkan harga" } }),
    f("thousandSep", "string", false, "Karakter pemisah ribuan. Default `\",\"` (contoh: `1,000`). Untuk format Indonesia gunakan `\".\"` (contoh: `1.000`).", { eg: { thousandSep: "." } }),
    f("decimalSep", "string", false, "Karakter pemisah desimal. Default `\".\"` (contoh: `10.50`). Untuk format Indonesia gunakan `\",\"` (contoh: `10,50`).", { eg: { decimalSep: "," } }),
    f("formula", "string", false, "Formula kalkulasi otomatis. Gunakan `${fieldKey}` untuk mereferensikan nilai field lain di form. Setiap field yang direferensikan dalam formula wajib memiliki `triggerFormula: true` agar kalkulasi berjalan saat nilai field tersebut berubah.", { eg: { formula: "${quantity} * ${unitPrice}" } }),
]

/** Base schema yang dibagi oleh semua Recursive Field (ITEM_LIST, CARD_LIST, FORM_CHILD). */
export const recursiveFields: Field[] = [
    // display
    f("title", "string", false, "Template judul item. Gunakan `{fieldKey}` untuk menyisipkan nilai dari field tertentu. Contoh: `{content}` akan menampilkan nilai field `content` sebagai judul.", { eg: { title: "{content}" } }),
    f("subtitle", "string", false, "Template sub-judul item. Sama seperti `title`, bisa menggunakan `{fieldKey}`.", { eg: { subtitle: "{category}" } }),
    f("keyTitle", "string", false, "Key field yang dijadikan judul item (alternatif dari template `title`).", { eg: { keyTitle: "content" } }),
    f("keySubTitle", "string", false, "Key field yang dijadikan sub-judul item.", { eg: { keySubTitle: "category" } }),
    f("firstTitle", "string", false, "Judul/header yang ditampilkan di atas daftar item (biasanya berupa label grup atau keterangan tambahan).", { eg: { firstTitle: "Daftar Item" } }),
    f("fieldKey", "string", false, "Key field utama yang dipakai sebagai identifier unik setiap item.", { eg: { fieldKey: "content" } }),
    // data source
    f("reportType", "string", false, "Tipe report/sumber data untuk mengambil item.", { enumValues: ["reports", "masterdata", "users", "tabs", "tasks", "ilcache", "recapitulations", "audit", "location"] }),
    f("collection", "string", false, "Nama collection/tabel database sumber data item.", { eg: { collection: "cipMatrix" } }),
    f("searchKeys", "object", false, "Mapping key field ke nilai replacer — digunakan untuk mencocokkan/mem-filter data dari database berdasarkan nilai field lain di form. Key-nya adalah nama field di collection, value-nya adalah [[replacer_overview|replacer]] yang mengambil nilai dari form.", { eg: { searchKeys: { content: "${$.$.formData.content}" } } }),
    f("params", "object", false, "Parameter filter query ke database (HashMap). Key-nya adalah nama field di collection masterdata/report, value-nya adalah nilai filter yang bisa diisi hardcode atau memakai [[replacer_overview|replacer]].", { eg: { params: { model: "${$.form9.formData.matrix}", label: "Before" } } }),
    f("ops", "object", false, "Operator filter untuk setiap key di `params`. Nilai: `IS`, `NE`, `IN`, `REGEX`, `GT`, `LT`, `GTE`, `LTE`. Default `IS` jika field tidak ada di `ops`.", { enumValues: ["IS", "NE", "IN", "REGEX", "GT", "LT", "GTE", "LTE"], eg: { ops: { stock: "GT" } } }),
    // grouping & sorting
    f("groupedByTitle", "boolean", false, "Mengelompokkan item berdasarkan `title`. Jika `true`, item dengan title yang sama akan digabung dalam satu grup.", { eg: { groupedByTitle: false } }),
    f("sortByTitle", "boolean", false, "Mengurutkan item berdasarkan judul secara alfabet.", { eg: { sortByTitle: true } }),
    f("showTotal", "boolean", false, "Menampilkan total jumlah item di header field.", { eg: { showTotal: false } }),
    // item actions
    f("itemAddable", "boolean", false, "Mengizinkan user menambah list/item baru ke dalam daftar. Jika `true`, tombol tambah item akan muncul. Hanya berlaku pada [[ITEM_LIST]] dan [[FORM_CHILD]].", { eg: { itemAddable: true } }),
    f("itemUpdatable", "boolean", false, "Mengizinkan user mengupdate/mengisi sub-field pada setiap item.", { eg: { itemUpdatable: true } }),
    f("itemDeletable", "boolean", false, "Mengizinkan user menghapus item dari daftar.", { eg: { itemDeletable: true } }),
    // sub-fields & defaults
    f("fields", "array", false, "Daftar sub-field yang ditampilkan di dalam setiap item/baris. Strukturnya sama seperti [[fields|Fields]] pada FORM biasa — setiap item adalah objek field dengan `key`, `label`, `type`, `isRequired`, `isDisabled`, `isVisible`, `order`, dll.", { of: "object", eg: { fields: [{ label: "Qty", type: "NUMBER", key: "qty", isRequired: true, order: 1 }] } }),
    f("insertDefault", "object", false, "Nilai default yang otomatis disisipkan ke sub-field saat item baru dibuat (sebelum user mengisi). Berguna untuk mengisi field tertentu secara otomatis.", { eg: { insertDefault: { status: "active", createdBy: "${$.userId}" } } }),
    f("executeRef", "array", false, "Daftar referensi eksekusi (key workflow/action) yang dijalankan saat item dibuat atau diubah.", { of: "string", eg: { executeRef: ["syncToInventory"] } }),
    f("outsideVal", "object", false, "Nilai dari luar scope form yang disisipkan ke setiap item. Key adalah nama field di item, value adalah sumber nilai (key field di form induk).", { eg: { outsideVal: { workflowId: "workflowId", submittedBy: "userId" } } }),
]

/* Reports reuse the Form base fields plus `isVisibleExport` (export-only, not used in Form).
   For now a copy of baseFields; will diverge as Reports docs are customised. */
export const baseFieldsReports: Field[] = [
    ...baseFields,
    f("isVisibleExport", "boolean", false, "Field ditampilkan saat export data."),
]

/** A representative example document for a field of the given `type`.
   `triggers` menambahkan triggerReload/triggerOption (DROPDOWN/CHECKBOX/RADIO);
   `view` menambahkan triggerView (khusus RADIO). */
const exampleFor = (type: string, opts: { triggers?: boolean; view?: boolean } = {}) => ({
    key: "exampleKey",
    label: "Contoh Field",
    type,
    order: 1,
    isVisible: true,
    isRequired: true,
    defaultValue: "contoh nilai",
    ...(opts.triggers ? {
        triggerReload: ["fieldLainKey"],
        triggerOption: ["fieldLainKey"],
    } : {}),
    ...(opts.view ? {
        triggerView: { No: ["catatanEnvCleanlines"] },
    } : {}),
})

/** Tandai sekumpulan field dengan label grup (memunculkan baris pemisah di tabel schema). */
const asGroup = (fields: Field[], group: string): Field[] => fields.map((fld) => ({ ...fld, group }))

/** baseFields dengan contoh (`eg`) untuk field `type` disesuaikan dengan tipe page-nya. */
const baseFieldsFor = (typeId: string): Field[] => baseFields.map((fld) => (fld.name === "type" ? { ...fld, eg: { type: typeId } } : fld))

export const fieldTypeCollections: Record<string, Collection> = {
    DROPDOWN: {
        section: "Workflows",
        description: "DROPDOWN adalah salah satu jenis (type) field pada FORM.",
        long: "DROPDOWN merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi DROPDOWN akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            selectionNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("DROPDOWN"), ...asGroup(selectionFields, "Selection")],
        example: {
            isRequired: false,
            label: "Nomor DO",
            type: "DROPDOWN",
            key: "tglPanen",
            isDisabled: true,
            isVisible: false,
            isHDSV: true,
            reportType: "reports",
            collection: "reportHasilPanen",
            searchKey: "tanggalPanen",
            searchKeyAdt: "qty",
            separator: " - ",
            order: 9,
            aggregateShow: true,
        },
        example2Label: "Contoh DROPDOWN dengan opsi static (hardcode).",
        example2: {
            label: "Assign To?",
            type: "DROPDOWN",
            key: "assign_to",
            order: 15,
            isRequired: true,
            isDisabled: true,
            options: ["CC", "SE"],
        },
        example3Label: "Contoh penggunaan triggerReload — DROPDOWN yang men-trigger field lain untuk di-reload otomatis saat nilainya berubah.",
        example3: [
            {
                label: "Idempier Code Customer",
                type: "DROPDOWN",
                key: "idempier_code_customer",
                collection: "customer",
                reportType: "masterdata",
                searchKey: "idempier_code_customer",
                isDisabled: false,
                triggerReload: ["customer_name"],
                order: 9,
                aggregateShow: true,
            },
            {
                label: "Customer Name",
                type: "TEXT",
                key: "customer_name",
                ref: {
                    collection: "contract",
                    reportType: "masterdata",
                    searchKey: "customer_name",
                    params: { idempier_code_customer: "${$.$.formData.idempier_code_customer}" },
                },
                placeholder: "Input Customer Name",
                isDisabled: true,
                order: 10,
                aggregateShow: true,
            },
        ],
        example4Label: "Contoh penggunaan triggerOption — DROPDOWN yang men-trigger reload opsi field lain berdasarkan nilai yang dipilih.",
        example4: [
            {
                isRequired: true,
                label: "Pilih Customer",
                type: "DROPDOWN",
                key: "customer",
                reportType: "reports",
                disalbeIfValueExist: true,
                collection: "reportProgressJTInternal",
                separator: " / ",
                params: { status_task: "ONGOING" },
                searchKeyAdt: "nomorTicket",
                searchKey: "customer_name",
                order: 1,
                triggerOption: ["employeeAssignment"],
            },
            {
                label: "Teknisi Awal",
                type: "DROPDOWN",
                sourceKey: ["customer"],
                key: "employeeAssignment",
                isDisabled: false,
                isVisible: true,
                ref: {
                    reportType: "reports",
                    collection: "reportProgressJTInternal",
                    searchKey: "assignmentTo",
                    params: { nomorTicket: "${SPLIT|${$.$.formData.customer}|__/__|1}" },
                },
                order: 2,
                aggregateShow: true,
            },
        ],
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    LABEL: {
        section: "Workflows",
        description: "LABEL adalah salah satu jenis (type) field pada FORM.",
        long: "LABEL merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi LABEL akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("LABEL"),
        example: exampleFor("LABEL"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    CHECKBOX: {
        section: "Workflows",
        description: "CHECKBOX adalah salah satu jenis (type) field pada FORM.",
        long: "CHECKBOX merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi CHECKBOX akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            selectionNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
            { kind: "warn", text: "`triggerReload` hanya berfungsi pada CHECKBOX jika `uiType` diset ke `\"DIALOG\"`. Tanpa `uiType: \"DIALOG\"`, `triggerReload` tidak akan berjalan." },
        ],
        fields: [...baseFieldsFor("CHECKBOX"), ...asGroup(selectionFields, "Selection")],
        example: {
            isRequired: true,
            label: "Nama Karyawan",
            type: "CHECKBOX",
            key: "namaKaryawans",
            collection: "mdNamaNik",
            reportType: "masterdata",
            searchKey: "nama",
            searchKeyAdt: "nik",
            params: { status: "Active" },
            order: 1,
        },
        example2Label: "Contoh CHECKBOX dengan `uiType: \"DIALOG\"` — opsi ditampilkan dalam modal/dropdown, cocok untuk pilihan banyak atau di perangkat mobile.",
        example2: {
            isRequired: true,
            label: "Nomor DO",
            type: "CHECKBOX",
            key: "tglPanen",
            isDisabled: false,
            isVisible: true,
            reportType: "reports",
            collection: "reportHasilPanen",
            searchKey: "tglPanen",
            uiType: "DIALOG",
            params: { status: "ONGOING" },
            order: 0,
            aggregateShow: true,
            triggerReload: ["listDO"],
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    RADIO: {
        section: "Workflows",
        description: "RADIO adalah field pilihan tunggal — user memilih satu nilai dari sekumpulan opsi yang ditampilkan sebagai radio button.",
        long: "RADIO merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini diimplementasikan oleh class Java yang sama dengan [[DROPDOWN]] dan [[CHECKBOX]] (class `Selection`), sehingga semua properti [[selection|Selection]] berlaku di sini. Perbedaan antara ketiganya hanya pada tampilan UI dan jumlah nilai yang bisa dipilih: RADIO dan DROPDOWN hanya boleh memilih satu nilai (String), sedangkan CHECKBOX bisa memilih banyak (List). Opsi RADIO bisa ditentukan secara statis (`options`) maupun diambil dinamis dari database (`reportType`/`collection`/`searchKey`), mendukung cascading (`sourceKey`/`useParent`), opsi bebas (`useOther`), serta divalidasi saat submit dan import. Saat import data dari Excel, nilai disamakan dengan DROPDOWN: dibersihkan dari format numerik (\"3.0\" → \"3\"), lalu divalidasi — jika tidak cocok dengan opsi yang tersedia, record ditandai invalid.",
        meta: { documents: "—", indexed: false },
        notes: [
            selectionNote,
            { kind: "note", text: "`triggerView` hanya berlaku pada RADIO. Isinya adalah mapping `value → daftar key field` — saat user memilih value tertentu, field-field yang terdaftar di sana akan ditampilkan. Contoh: `{ \"No\": [\"catatanField\"] }` akan menampilkan field `catatanField` saat user memilih opsi `\"No\"`." },
            { kind: "warn", text: "`btnSelectAll` dan `uiType` hanya berlaku untuk [[CHECKBOX]], bukan RADIO. Jangan gunakan kedua properti ini pada field RADIO." },
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("RADIO"), ...asGroup(selectionFields, "Selection")],
        example: {
            key: "is_overtime",
            label: "Lembur?",
            type: "RADIO",
            isRequired: true,
            isDisabled: false,
            options: ["Yes", "No"],
            triggerView: { Yes: ["overtime_hours", "overtime_reason"] },
            order: 5,
            aggregateShow: true,
        },
        example2Label: "Contoh RADIO dengan opsi dinamis dari masterdata dan cascading via `sourceKey`.",
        example2: {
            key: "shift",
            label: "Shift Kerja",
            type: "RADIO",
            isRequired: true,
            isDisabled: false,
            reportType: "masterdata",
            collection: "mdShift",
            searchKey: "shift_name",
            params: { department: "${$.$.formData.department}" },
            sort: true,
            order: 6,
            aggregateShow: true,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    TEXT: {
        section: "Workflows",
        description: "TEXT adalah field input teks satu baris — tipe paling dasar dan sekaligus fondasi bagi TEXT_AREA, EMAIL, TEXT_NUMBER, TEXT_JSON, dan PHONENUMBER.",
        long: "TEXT merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini diimplementasikan oleh class Java `Text` yang dipakai bersama oleh lima tipe sekaligus: TEXT, [[TEXT_AREA]], [[EMAIL]], [[TEXT_NUMBER]], dan [[TEXT_JSON]] — perbedaannya murni di sisi client (validasi/keyboard/tampilan). `Text` juga menjadi induk dari [[PHONENUMBER]]. Properti spesifiknya hanya tiga: `placeholder`, `minLength`, dan `maxLength`. Tidak ada validasi nilai khusus — nilai apa pun diterima. Saat import data dari Excel, nilai yang berakhiran `.0` (misalnya `\"123.0\"`) akan dibersihkan menjadi `\"123\"`. Saat export CSV, karakter `;` dalam nilai akan diganti `,` agar tidak merusak struktur file.",
        meta: { documents: "—", indexed: false },
        notes: [
            textNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("TEXT"), ...asGroup(textFields, "Text")],
        example: {
            key: "customer_name",
            label: "Nama Customer",
            type: "TEXT",
            isRequired: true,
            isDisabled: false,
            placeholder: "Masukkan nama customer",
            maxLength: 100,
            order: 1,
            aggregateShow: true,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    TEXT_AREA: {
        section: "Workflows",
        description: "TEXT_AREA adalah field input teks multi-baris — cocok untuk catatan, deskripsi panjang, atau keterangan bebas.",
        long: "TEXT_AREA merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini menggunakan class Java yang sama dengan [[TEXT]] (`Text`) — perbedaannya hanya di sisi client: TEXT_AREA menampilkan kotak input multi-baris (textarea). Properti yang berlaku sama: `placeholder`, `minLength`, `maxLength`. Tidak ada pembersihan khusus saat import — nilai diambil apa adanya.",
        meta: { documents: "—", indexed: false },
        notes: [
            textNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("TEXT_AREA"), ...asGroup(textFields, "Text")],
        example: {
            key: "catatan",
            label: "Catatan",
            type: "TEXT_AREA",
            isRequired: false,
            isDisabled: false,
            placeholder: "Tulis catatan di sini…",
            maxLength: 500,
            order: 8,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    TEXT_NUMBER: {
        section: "Workflows",
        description: "TEXT_NUMBER adalah field input angka yang disimpan sebagai string — cocok untuk nomor yang tidak perlu dihitung (nomor dokumen, kode, dsb.).",
        long: "TEXT_NUMBER merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini menggunakan class Java yang sama dengan [[TEXT]] (`Text`). Di sisi client, keyboard yang tampil adalah keyboard numerik. Nilainya tetap disimpan sebagai string, bukan angka, sehingga tidak bisa dipakai untuk formula/kalkulasi. Cocok untuk nomor yang hanya perlu disimpan, bukan dihitung — misalnya nomor BPJS, nomor KTP, kode barang. Saat import dari Excel, akhiran `.0` dibersihkan sama seperti TEXT. Untuk angka yang perlu dihitung, gunakan [[NUMBER]] atau [[DECIMAL]].",
        meta: { documents: "—", indexed: false },
        notes: [
            textNote,
            { kind: "note", text: "Nilai disimpan sebagai **string**, bukan number. Gunakan [[NUMBER]] atau [[DECIMAL]] jika nilainya perlu ikut kalkulasi/formula." },
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("TEXT_NUMBER"), ...asGroup(textFields, "Text")],
        example: {
            key: "no_bpjs",
            label: "Nomor BPJS",
            type: "TEXT_NUMBER",
            isRequired: true,
            isDisabled: false,
            placeholder: "Masukkan nomor BPJS",
            maxLength: 20,
            order: 4,
            aggregateShow: true,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    TEXT_JSON: {
        section: "Workflows",
        description: "TEXT_JSON adalah field yang menyimpan string berformat JSON — dipakai untuk data terstruktur yang belum memiliki tipe field khusus.",
        long: "TEXT_JSON merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini menggunakan class Java yang sama dengan [[TEXT]] (`Text`). Di sisi client, input divalidasi sebagai JSON yang valid sebelum bisa di-submit. Nilai disimpan sebagai string JSON mentah. Tidak ada pembersihan khusus saat import. Dipakai ketika data yang perlu disimpan adalah objek/array terstruktur yang tidak muat dalam tipe field lain.",
        meta: { documents: "—", indexed: false },
        notes: [
            textNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("TEXT_JSON"), ...asGroup(textFields, "Text")],
        example: {
            key: "config_data",
            label: "Konfigurasi",
            type: "TEXT_JSON",
            isRequired: false,
            isDisabled: false,
            placeholder: '{"key": "value"}',
            order: 12,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    DECIMAL: {
        section: "Workflows",
        description: "DECIMAL adalah field input angka dengan dukungan nilai desimal dan formatting.",
        long: "DECIMAL merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini dipakai untuk input angka yang membutuhkan nilai desimal (pecahan). Mendukung formatting ribuan/desimal, validasi min-max, dan formula kalkulasi otomatis.",
        meta: { documents: "—", indexed: false },
        notes: [
            numericNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("DECIMAL"), ...asGroup(numericFields, "Numeric Fields")],
        example: {
            key: "beratBersih",
            label: "Berat Bersih",
            type: "DECIMAL",
            order: 3,
            isRequired: true,
            unit: "kg",
            decimalCount: 2,
            min: 0,
            thousandSep: ".",
            decimalSep: ",",
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    EMAIL: {
        section: "Workflows",
        description: "EMAIL adalah field input alamat email dengan validasi format di sisi client.",
        long: "EMAIL merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini menggunakan class Java yang sama dengan [[TEXT]] (`Text`). Di sisi client, input divalidasi sebagai alamat email yang valid (harus mengandung `@` dan domain) sebelum bisa di-submit. Tidak ada pembersihan khusus saat import — nilai diambil apa adanya. Properti `placeholder`, `minLength`, dan `maxLength` sama-sama berlaku.",
        meta: { documents: "—", indexed: false },
        notes: [
            textNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("EMAIL"), ...asGroup(textFields, "Text")],
        example: {
            key: "email_pic",
            label: "Email PIC",
            type: "EMAIL",
            isRequired: true,
            isDisabled: false,
            placeholder: "nama@perusahaan.com",
            order: 5,
            aggregateShow: true,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    NUMBER: {
        section: "Workflows",
        description: "NUMBER adalah field input angka bulat (integer) dengan dukungan formatting dan validasi min-max.",
        long: "NUMBER merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini dipakai untuk input angka bulat (tanpa desimal). Mendukung formatting pemisah ribuan, validasi min-max, satuan (`unit`), dan formula kalkulasi otomatis. Untuk angka dengan desimal, gunakan [[DECIMAL]].",
        meta: { documents: "—", indexed: false },
        notes: [
            numericNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [...baseFieldsFor("NUMBER"), ...asGroup(numericFields, "Numeric Fields")],
        example: {
            key: "qty",
            label: "Quantity",
            type: "NUMBER",
            order: 2,
            isRequired: true,
            unit: "pcs",
            decimalCount: 0,
            min: 1,
            max: 9999,
            thousandSep: ",",
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    MAP: {
        section: "Workflows",
        description: "MAP adalah salah satu jenis (type) field pada FORM.",
        long: "MAP merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi MAP akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("MAP"),
        example: exampleFor("MAP"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    OFFICER_SELECT: {
        section: "Workflows",
        description: "OFFICER_SELECT adalah salah satu jenis (type) field pada FORM.",
        long: "OFFICER_SELECT merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi OFFICER_SELECT akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("OFFICER_SELECT"),
        example: exampleFor("OFFICER_SELECT"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    RATE: {
        section: "Workflows",
        description: "RATE adalah salah satu jenis (type) field pada FORM.",
        long: "RATE merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi RATE akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("RATE"),
        example: exampleFor("RATE"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    PHONENUMBER: {
        section: "Workflows",
        description: "PHONENUMBER adalah field input nomor telepon dengan validasi prefix operator dan kode negara.",
        long: "PHONENUMBER merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini merupakan varian dari [[TEXT]] yang dikhususkan untuk input nomor telepon. Yang membedakannya dari TEXT biasa adalah dua properti tambahan — `countryCode` (default `\"62\"` untuk Indonesia) dan `prefixes` (daftar awalan operator seluler yang valid, misalnya 811, 812, 821, dst.) — serta penanganan khusus saat import data dari Excel: nilai yang berformat numerik atau notasi ilmiah (misalnya `6.28E12`) dikonversi menggunakan `BigDecimal` agar nomor tidak rusak. Jika konversi gagal, record ditandai invalid.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "`prefixes` berisi daftar awalan operator seluler Indonesia: Telkomsel (811–813), Indosat (814–816), XL (817–819), dan lainnya, termasuk kode area 21 (telepon kabel Jakarta). Daftar ini dipakai untuk validasi atau hint di sisi client." },
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [
            ...baseFieldsFor("PHONENUMBER"),
            ...asGroup([
                f("countryCode", "string", false, "Kode negara yang digunakan untuk validasi. Default `\"62\"` (Indonesia).", { eg: { countryCode: "62" } }),
                f("prefixes", "array", false, "Daftar prefix operator seluler yang valid untuk validasi/hint di client. Berisi 50+ prefix operator Indonesia (811, 812, 813, …). Jika tidak diisi, sistem menggunakan daftar default.", { of: "string", eg: { prefixes: ["811", "812", "813", "821", "822"] } }),
                f("placeholder", "string", false, "Teks placeholder sebelum user mengisi. Contoh umum: `\"628xxx\"`.", { eg: { placeholder: "628xxx" } }),
                f("minLength", "number", false, "Panjang minimum karakter yang boleh diinput. Default `0`.", { eg: { minLength: 10 } }),
                f("maxLength", "number", false, "Panjang maksimum karakter yang boleh diinput. Default `999`.", { eg: { maxLength: 15 } }),
            ], "PHONENUMBER"),
        ],
        example: {
            isRequired: true,
            defaultValue: "",
            label: "Nomor Telepon Perusahaan",
            placeholder: "628xxx",
            type: "PHONENUMBER",
            key: "company_phone",
            maxLength: 100,
            isDisabled: false,
            order: 11,
            aggregateShow: true,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    CURRENCY: {
        section: "Workflows",
        description: "CURRENCY adalah field input nilai uang/mata uang dengan formatting simbol, pemisah ribuan/desimal, dan validasi min-max.",
        long: "CURRENCY merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini extends dari Numeric ([[numeric_fields|Numeric Fields]]) dengan tambahan property `currency` untuk menampilkan simbol mata uang di depan nilai input. Mendukung formatting IDR (`thousandSep: \".\"`, `decimalSep: \",\"`), USD (`thousandSep: \",\"`, `decimalSep: \".\"`), dan mata uang lainnya. Nilai `currency` bisa diisi statis maupun dinamis menggunakan replacer dari field lain.",
        meta: { documents: "—", indexed: false },
        notes: [
            numericNote,
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: [
            ...baseFieldsFor("CURRENCY"),
            ...asGroup([
                f("currency", "string", false, "Simbol atau kode mata uang yang ditampilkan di depan nilai input (contoh: `\"Rp\"`, `\"$\"`, `\"€\"`, `\"USD\"`). Bisa diisi dinamis menggunakan replacer dari field lain.", { eg: { currency: "Rp" } }),
            ], "CURRENCY"),
            ...asGroup(numericFields, "Numeric Fields"),
        ],
        example: {
            key: "price",
            label: "Harga",
            type: "CURRENCY",
            order: 4,
            isRequired: true,
            currency: "Rp",
            unit: "Rp",
            decimalCount: 0,
            thousandSep: ".",
            decimalSep: "",
            min: 0,
            max: 999999999,
        },
        example2Label: "Contoh CURRENCY USD dengan 2 desimal dan formula kalkulasi otomatis.",
        example2: {
            key: "total",
            label: "Total",
            type: "CURRENCY",
            order: 5,
            isRequired: false,
            isDisabled: true,
            currency: "$",
            unit: "$",
            decimalCount: 2,
            thousandSep: ",",
            decimalSep: ".",
            formula: "${quantity} * ${unitPrice}",
            min: 0,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    DATETIME: {
        section: "Workflows",
        description: "DATETIME adalah field input tanggal dan/atau waktu dengan flexible formatting, dukungan multiple picker (MONTH, DATE, TIME), dan validasi min-max.",
        long: "DATETIME merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini mendukung tiga jenis picker yang bisa dikombinasikan: `MONTH` (bulan & tahun), `DATE` (tanggal), dan `TIME` (waktu). Format tampilan di UI (`showFormat`) dan format penyimpanan ke database (`submitFormat`) dikonfigurasi secara terpisah menggunakan pola Java `SimpleDateFormat` — contoh: `dd/MM/yyyy HH:mm`. Field juga mendukung auto-fill tanggal hari ini dan pembatasan rentang tanggal via `min`/`max`.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, hapus saja agar dokumen tidak terlalu panjang." },
            { kind: "note", text: "`pickers` menentukan komponen yang ditampilkan. Isi dengan kombinasi `\"MONTH\"`, `\"DATE\"`, dan/atau `\"TIME\"`. Contoh: `[\"DATE\", \"TIME\"]` menampilkan date + time picker sekaligus. Format pola yang umum dipakai — `yyyy` (tahun), `MM` (bulan angka), `MMMM` (nama bulan), `dd` (tanggal), `HH` (jam 24h), `hh` (jam 12h), `mm` (menit), `ss` (detik), `a` (AM/PM), `EEEE` (nama hari lengkap)." },
        ],
        fields: [
            ...baseFieldsFor("DATETIME"),
            ...asGroup([
                f("pickers", "array", false, "Komponen picker yang ditampilkan. Bisa berisi kombinasi `\"MONTH\"`, `\"DATE\"`, dan/atau `\"TIME\"`.", { of: "string", enumValues: ["MONTH", "DATE", "TIME"], eg: { pickers: ["DATE", "TIME"] } }),
                f("showFormat", "string", false, "Format tampilan tanggal/waktu di UI, menggunakan pola Java `SimpleDateFormat`. Contoh: `dd/MM/yyyy HH:mm` → `22/06/2026 14:30`.", { eg: { showFormat: "dd/MM/yyyy HH:mm" } }),
                f("submitFormat", "string", false, "Format penyimpanan ke database. Default bergantung pada `pickers`: `yyyy-MM` (MONTH), `yyyy-MM-dd` (DATE), `HH:mm:ss` (TIME), `yyyy-MM-dd HH:mm:ss` (DATE + TIME).", { eg: { submitFormat: "yyyy-MM-dd HH:mm:ss" } }),
                f("is24h", "boolean", false, "Format jam 24 jam (`true`) atau 12 jam dengan AM/PM (`false`). Default `true`.", { eg: { is24h: true } }),
                f("autofillTodayDate", "boolean", false, "Jika `true`, field otomatis diisi dengan tanggal/waktu hari ini saat form pertama kali dibuka.", { eg: { autofillTodayDate: true } }),
                f("min", "string", false, "Tanggal/waktu minimum yang bisa dipilih user. Format mengikuti `submitFormat`.", { eg: { min: "2026-01-01" } }),
                f("max", "string", false, "Tanggal/waktu maksimum yang bisa dipilih user. Format mengikuti `submitFormat`.", { eg: { max: "2026-12-31" } }),
                f("decodeFormat", "string", false, "Format decode untuk parsing nilai dari database. Deprecated — tidak perlu diisi untuk konfigurasi baru.", { eg: { decodeFormat: "yyyy-MM-dd" } }),
            ], "DATETIME"),
        ],
        example: {
            key: "tanggalMulai",
            label: "Tanggal Mulai Izin",
            type: "DATETIME",
            value: null,
            isRequired: true,
            isDisabled: false,
            pickers: ["DATE"],
            copyFrom: "${DATETIME|0.0.0.0.0.0|yyyy-MM-dd}",
            showFormat: "dd MMM yyyy",
            submitFormat: "yyyy-MM-dd",
            decodeFormat: "yyyy-MM-dd",
            min: "${DATETIME|-1.0.0.0.0.0|yyyy-MM-dd}",
            max: "${DATETIME|1.0.0.0.0.0|yyyy-MM-dd}",
            aggregateShow: true,
            order: 2,
        },
        example2Label: "Contoh TIME picker — input waktu saja dengan format 24 jam.",
        example2: {
            key: "waktu_olah",
            label: "Waktu Mulai Pengolahan",
            type: "DATETIME",
            value: null,
            isRequired: true,
            isDisabled: false,
            isReplace: false,
            pickers: ["TIME"],
            showFormat: "HH:mm:ss",
            submitFormat: "HH:mm:ss",
            decodeFormat: "HH:mm:ss",
            min: "00:00:00",
            max: "23:59:59",
            aggregateShow: true,
            order: 3,
        },
        example3Label: "Contoh DATE + TIME picker — input tanggal dan waktu sekaligus.",
        example3: {
            key: "jadwal_pengerjaan",
            label: "Jadwal Pengerjaan",
            type: "DATETIME",
            isVisible: true,
            isRequired: true,
            isDisabled: false,
            pickers: ["DATE", "TIME"],
            showFormat: "dd-MMM-yyyy HH:mm:ss",
            submitFormat: "yyyy-MM-dd HH:mm:ss",
            decodeFormat: "yyyy-MM-dd HH:mm:ss",
            min: "${DATETIME|-1.0.0.0.0.0|yyyy-MM-dd} 00:00:00",
            max: "${DATETIME|1.0.0.0.0.0|yyyy-MM-dd} 23:59:59",
            order: 11,
        },
        example4Label: "Contoh MONTH picker — input bulan dan tahun saja.",
        example4: {
            key: "report_month",
            label: "Bulan Laporan",
            type: "DATETIME",
            order: 6,
            isRequired: true,
            pickers: ["MONTH"],
            showFormat: "MMMM yyyy",
            submitFormat: "yyyy-MM",
            min: "${DATETIME|-1.0.0.0.0.0|yyyy-MM-dd}",
            max: "${DATETIME|1.0.0.0.0.0|yyyy-MM-dd}",
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    DATE_MULTIPLE: {
        section: "Workflows",
        description: "DATE_MULTIPLE adalah field untuk memilih banyak tanggal sekaligus, disimpan sebagai array. Berbeda dengan DATETIME yang hanya satu tanggal.",
        long: "DATE_MULTIPLE merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini memungkinkan user memilih lebih dari satu tanggal dalam satu field — disimpan sebagai array string (contoh: `[\"2026-06-07\", \"2026-06-08\"]`). Berbeda dengan [[DATETIME]] yang hanya mendukung satu nilai tanggal/waktu, DATE_MULTIPLE cocok untuk kasus seperti pengajuan cuti, jadwal kerja, atau tanggal event yang bisa lebih dari satu.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, hapus saja agar dokumen tidak terlalu panjang." },
            { kind: "note", text: "Nilai yang disimpan ke database adalah array of string, bukan single string. Format tanggal mengikuti `decodeFormat`." },
        ],
        fields: [
            ...baseFieldsFor("DATE_MULTIPLE"),
            ...asGroup([
                f("showFormat", "string", false, "Format tampilan tanggal di UI, menggunakan pola Java `SimpleDateFormat`. Contoh: `dd/MM/yyyy` → `22/06/2026`, `dd MMMM yyyy` → `22 Juni 2026`.", { eg: { showFormat: "dd/MM/yyyy" } }),
                f("decodeFormat", "string", false, "Format untuk decode/parse nilai tanggal dari database.", { eg: { decodeFormat: "yyyy-MM-dd" } }),
                f("min", "string", false, "Tanggal minimum yang bisa dipilih user. Format `yyyy-MM-dd`.", { eg: { min: "2026-01-01" } }),
                f("max", "string", false, "Tanggal maksimum yang bisa dipilih user. Format `yyyy-MM-dd`.", { eg: { max: "2026-12-31" } }),
            ], "DATE_MULTIPLE"),
        ],
        example: {
            key: "leave_dates",
            label: "Tanggal Cuti",
            type: "DATE_MULTIPLE",
            order: 5,
            isRequired: true,
            isDisabled: false,
            showFormat: "dd/MM/yyyy",
            decodeFormat: "yyyy-MM-dd",
            min: "2026-01-01",
            max: "2026-12-31",
        },
        example2Label: "Contoh dengan min/max dinamis menggunakan replacer DATETIME.",
        example2: {
            key: "work_days",
            label: "Jadwal Kerja Bulan Ini",
            type: "DATE_MULTIPLE",
            order: 6,
            isRequired: true,
            isDisabled: false,
            showFormat: "EEE, dd MMMM",
            decodeFormat: "yyyy-MM-dd",
            min: "${DATETIME|-1.0.0.0.0.0|yyyy-MM-dd}",
            max: "${DATETIME|1.0.0.0.0.0|yyyy-MM-dd}",
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    IMAGE: {
        section: "Workflows",
        description: "IMAGE adalah field untuk upload atau capture gambar dari berbagai sumber (kamera, galeri, scan kartu, tanda tangan) dengan quality control dan watermarking otomatis.",
        long: "IMAGE merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. Field ini memungkinkan user mengupload atau mengambil gambar dari berbagai sumber melalui `pickers` — kamera depan/belakang, galeri, tanda tangan digital, scan kartu (OCR), hingga face recognition. Kualitas output dikontrol via `quality` (HIGH/MEDIUM/LOW), dan watermark otomatis (GPS, alamat, peta, caption) bisa ditambahkan via `waterMarks`.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, hapus saja agar dokumen tidak terlalu panjang." },
            { kind: "note", text: "`pickers` menentukan tombol/sumber gambar yang ditampilkan ke user. Bisa diisi lebih dari satu — contoh: `[\"REAR_CAM\", \"GALLERY\"]` menampilkan dua tombol sekaligus." },
        ],
        fields: [
            ...baseFieldsFor("IMAGE"),
            ...asGroup([
                f("pickers", "array", false, "Daftar sumber gambar yang ditampilkan. Nilai yang tersedia: `FRONT_CAM` (kamera depan/selfie), `REAR_CAM` (kamera belakang), `GALLERY` (pilih dari galeri), `SIGN` (tanda tangan digital), `CARD_OCR` (scan kartu dengan OCR), `FACEMATCH` (face recognition).", { of: "string", enumValues: ["FRONT_CAM", "REAR_CAM", "GALLERY", "SIGN", "CARD_OCR", "FACEMATCH"], eg: { pickers: ["REAR_CAM", "GALLERY"] } }),
                f("quality", "string", false, "Kualitas output gambar. `HIGH` (~5–10 MB, cocok untuk dokumen/KTP), `MEDIUM` (~2–5 MB, general purpose), `LOW` (~500 KB–2 MB, bandwidth terbatas).", { enumValues: ["HIGH", "MEDIUM", "LOW"], eg: { quality: "MEDIUM" } }),
                f("waterMarks", "array", false, "Daftar watermark yang ditambahkan otomatis ke gambar. `LATLONG` (koordinat GPS), `ADDRESS` (alamat dari GPS), `MAP_PICT` (screenshot peta), `CAPTION` (teks caption custom).", { of: "string", enumValues: ["LATLONG", "ADDRESS", "MAP_PICT", "CAPTION"], eg: { waterMarks: ["LATLONG", "ADDRESS"] } }),
                f("wma", "string", false, "Posisi watermark pada gambar. `LEFT` (sisi kiri) atau `RIGHT` (sisi kanan).", { enumValues: ["LEFT", "RIGHT"], eg: { wma: "LEFT" } }),
                f("dir", "string", false, "Subdirektori penyimpanan custom. Jika diisi, gambar disimpan di `/{companyId}/{dir}/images/`. Jika kosong, default ke `/{companyId}/images/`.", { eg: { dir: "field_reports" } }),
                f("globalPath", "string", false, "Path URL gambar yang di-generate otomatis oleh sistem setelah upload. Tidak perlu diisi secara manual.", { eg: { globalPath: "https://server/uploads/company001/images/photo.jpg" } }),
            ], "IMAGE"),
        ],
        example: {
            key: "field_photo",
            label: "Foto Lapangan",
            type: "IMAGE",
            order: 5,
            isRequired: true,
            isDisabled: false,
            pickers: ["REAR_CAM", "FRONT_CAM", "GALLERY"],
            waterMarks: ["LATLONG", "ADDRESS"],
            wma: "LEFT",
        },
        example2Label: "Contoh scan KTP dengan OCR dan kualitas tinggi.",
        example2: {
            key: "id_card_photo",
            label: "Foto KTP",
            type: "IMAGE",
            order: 3,
            isRequired: true,
            isDisabled: false,
            pickers: ["CARD_OCR", "GALLERY"],
            quality: "HIGH",
            waterMarks: ["LATLONG", "ADDRESS"],
            wma: "LEFT",
        },
        example3Label: "Contoh input tanda tangan digital.",
        example3: {
            key: "signature",
            label: "Tanda Tangan",
            type: "IMAGE",
            order: 10,
            isRequired: true,
            isDisabled: false,
            pickers: ["SIGN"],
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    IMAGE_KIT: {
        section: "Workflows",
        description: "IMAGE_KIT adalah salah satu jenis (type) field pada FORM.",
        long: "IMAGE_KIT merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi IMAGE_KIT akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("IMAGE_KIT"),
        example: exampleFor("IMAGE_KIT"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    VIDEO: {
        section: "Workflows",
        description: "VIDEO adalah salah satu jenis (type) field pada FORM.",
        long: "VIDEO merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi VIDEO akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("VIDEO"),
        example: exampleFor("VIDEO"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    AUDIO: {
        section: "Workflows",
        description: "AUDIO adalah salah satu jenis (type) field pada FORM.",
        long: "AUDIO merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi AUDIO akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("AUDIO"),
        example: exampleFor("AUDIO"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    IMAGE_DRAW: {
        section: "Workflows",
        description: "IMAGE_DRAW adalah salah satu jenis (type) field pada FORM.",
        long: "IMAGE_DRAW merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi IMAGE_DRAW akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("IMAGE_DRAW"),
        example: exampleFor("IMAGE_DRAW"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    SCAN_QR: {
        section: "Workflows",
        description: "SCAN_QR adalah salah satu jenis (type) field pada FORM.",
        long: "SCAN_QR merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi SCAN_QR akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("SCAN_QR"),
        example: exampleFor("SCAN_QR"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    LOUNGE_FILE: {
        section: "Workflows",
        description: "LOUNGE_FILE adalah salah satu jenis (type) field pada FORM.",
        long: "LOUNGE_FILE merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi LOUNGE_FILE akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("LOUNGE_FILE"),
        example: {
            key: "fileInvoice",
            label: "File Invoice",
            type: "LOUNGE_FILE",
            value: null,
            isRequired: true,
            isDisabled: false,
            isVisible: true,
            aggregateShow: true,
            order: 4,
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    NESTED_DROPDOWN: {
        section: "Workflows",
        description: "NESTED_DROPDOWN adalah salah satu jenis (type) field pada FORM.",
        long: "NESTED_DROPDOWN merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi NESTED_DROPDOWN akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("NESTED_DROPDOWN"),
        example: exampleFor("NESTED_DROPDOWN"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    ITEM_LIST: {
        section: "Workflows",
        description: "ITEM_LIST menampilkan daftar item dalam format tabel/list, dan setiap item memiliki sub-field yang dapat diisi atau diupdate (Recursive Field v1).",
        long: "ITEM_LIST merupakan Recursive Field versi pertama (v1) pada [[fields|Fields]] di sebuah FORM. Field ini mengambil data dari database (via `reportType`/`collection`/`params`), lalu menampilkannya sebagai daftar tabel baris per baris. Setiap baris memiliki judul (`keyTitle`/`title`) dan sub-judul (`keySubTitle`/`subtitle`), serta dapat memiliki sub-field (`fields`) yang bisa diisi oleh user.",
        meta: { documents: "—", indexed: false },
        notes: [
            recursiveNote,
            { kind: "tip", text: "Tidak semua schema pada field ini wajib dipakai. Apabila schema tidak dibutuhkan, hapus saja agar dokumen tidak terlalu panjang." },
        ],
        fields: [
            ...baseFieldsFor("ITEM_LIST"),
            ...asGroup([
                f("groupedBy", "string", false, "Mengelompokkan item berdasarkan field ini (nama field di collection). Berbeda dengan `groupedByTitle` di [[CARD_LIST]] yang mengelompokkan berdasarkan nilai `title`, `groupedBy` mengelompokkan berdasarkan nama field secara langsung.", { eg: { groupedBy: "category" } }),
            ], "ITEM_LIST"),
            ...asGroup(recursiveFields, "Recursive Fields"),
        ],
        example: {
            isVisible: true,
            isHDSV: true,
            key: "seragam",
            label: "Seragam",
            type: "ITEM_LIST",
            value: null,
            isRequired: true,
            isDisabled: false,
            title: "Jenis Seragam : {jenis}",
            subtitle: "Adjustment : {adjustment}",
            aggregateShow: true,
            itemAddable: true,
            itemDeletable: true,
            order: 3,
            fields: [
                { isRequired: true, label: "Jabatan", type: "DROPDOWN", key: "jabatan", reportType: "masterdata", collection: "mdMapSeragam", searchKey: "jabatan", isDisabled: false, order: 0, triggerOption: ["jenis"] },
                { isRequired: true, isDisabled: false, label: "Jenis Seragam", type: "DROPDOWN", key: "jenis", reportTypex: "masterdata", collectionx: "mdSeragam", searchKeyx: "jenis", order: 0, triggerReload: ["stock"] },
                { isRequired: true, label: "Jumlah Seragam", type: "TEXT", key: "stock", isDisabled: true, order: 1 },
                { isRequired: true, label: "Penjumlah", type: "NUMBER", key: "penjumlah", isVisible: false, value: 0, isDisabled: true, order: 1 },
                { isRequired: true, label: "Adjustment", type: "NUMBER", key: "adjustment", isDisabled: false, isVisible: true, order: 1 },
            ],
        },
        example2Label: "Contoh ITEM_LIST dengan `searchKeys` — data item di-populate dari masterdata, dengan nilai setiap key diisi via replacer dari form induk.",
        example2: {
            isVisible: true,
            isHDSV: true,
            key: "seragam",
            label: "Seragam",
            type: "ITEM_LIST",
            value: null,
            title: "{jenis}",
            subtitle: "Jumlah Yang Diberikan : {jumlahYangDiberikan}",
            reportType: "masterdata",
            collection: "mdSeragam",
            searchKeys: {
                jenis: "${$.$.formData.jenis}",
                harga: "${$.$.formData.harga}",
                stock: "${$.$.formData.jumlahSeragam}",
                stockAktual: "${$.$.formData.stockAktual}",
                pengembalian: "${$.$.formData.pengembalian}",
                penerimaan: "${$.$.formData.penerimaan}",
                jumlahYangDiberikan: "${NUMBER|0}",
            },
            params: {
                jabatan: "${$.$.formData.jabatan}",
            },
            insertParamsToVal: true,
            fieldKey: "jenis",
            firstTitle: "",
            ref: {},
            keyTitle: "${$.$.formData.jenis}",
            keySubTitle: "Stock : ${$.$.formData.jumlahSeragam} | Harga : ${DECFORM|${$.$.formData.harga}}",
            isRequired: true,
            isDisabled: false,
            aggregateShow: true,
            itemAddable: false,
            itemDeletable: true,
            order: 5,
            fields: [
                { isRequired: true, label: "Jabatan", type: "TEXT", key: "jabatan", reportTypex: "masterdata", collectionx: "mdSeragam", searchKeyx: "jenis", isDisabled: true, order: 0 },
                { isRequired: true, label: "Jenis Seragam", type: "TEXT", key: "jenis", reportTypex: "masterdata", collectionx: "mdSeragam", searchKeyx: "jenis", isDisabled: true, order: 0 },
                { isRequired: true, isDisabled: true, label: "Harga Satuan", type: "CURRENCY", key: "harga", reportType: "masterdata", collection: "mdSeragam", searchKey: "harga", triggerFormula: true, order: 1 },
                { isRequired: true, isDisabled: true, label: "Stock Seragam", type: "CURRENCY", key: "stock", reportType: "masterdata", collection: "mdSeragam", searchKey: "harga", order: 1 },
                { isRequired: true, isDisabled: true, label: "Stock Aktual Seragam", type: "CURRENCY", key: "stockAktual", reportType: "masterdata", collection: "mdSeragam", searchKey: "harga", order: 1 },
                { isRequired: false, isDisabled: true, label: "Pengembalian", type: "CURRENCY", key: "pengembalian", isVisible: false, reportType: "masterdata", collection: "mdSeragam", searchKey: "harga", order: 1 },
                { isRequired: false, isDisabled: true, label: "Penerimaan", type: "CURRENCY", key: "penerimaan", isVisible: false, reportType: "masterdata", collection: "mdSeragam", searchKey: "harga", order: 1 },
                { label: "Jumlah yang diberikan", type: "NUMBER", key: "jumlahYangDiberikan", isDisabled: false, triggerFormula: true, order: 2, aggregateShow: true, isReplace: false },
            ],
        },
        example3Label: "Contoh ITEM_LIST di dalam `fieldsAfterSubmit` dengan `executeRef` — items di-populate via `reportVariable` dari nilai form, dan sub-field di-autofill dari masterdata menggunakan `ref`.",
        example3: {
            reportVariable: "${$.$.formData.seragam}",
            isVisible: true,
            isHDSV: true,
            key: "seragam",
            label: "Seragam",
            type: "ITEM_LIST",
            value: null,
            isRequired: true,
            isDisabled: false,
            title: "Jenis Seragam : {jenis}",
            subtitle: "Adjustment : {adjustment}",
            aggregateShow: true,
            itemAddable: true,
            itemDeletable: true,
            order: 3,
            executeRef: ["stock", "penerimaan", "pengembalian"],
            fields: [
                {
                    key: "stock",
                    label: "Stock Awal",
                    type: "NUMBER",
                    value: null,
                    isRequired: true,
                    isDisabled: false,
                    aggregateShow: true,
                    placeholder: "--Please Select--",
                    order: 0,
                    ref: { reportType: "masterdata", collection: "mdSeragam", searchKey: "jumlahSeragam", params: { jabatan: "${$.$.formData.jabatan}", jenis: "${$.$.formData.jenis}" }, defaultValue: "${NUMBER|0|INTEGER}" },
                },
                {
                    key: "penerimaan",
                    label: "Penerimaan",
                    type: "CURRENCY",
                    isVisible: true,
                    isRequired: false,
                    isDisabled: true,
                    aggregateShow: true,
                    order: 0,
                    ref: { reportType: "masterdata", collection: "mdSeragam", searchKey: "penerimaan", params: { jabatan: "${$.$.formData.jabatan}", jenis: "${$.$.formData.jenis}" }, defaultValue: "${NUMBER|0|INTEGER}" },
                },
                {
                    key: "pengembalian",
                    label: "Pengembalian",
                    type: "CURRENCY",
                    isVisible: true,
                    isRequired: false,
                    isDisabled: true,
                    aggregateShow: true,
                    order: 0,
                    ref: { reportType: "masterdata", collection: "mdSeragam", searchKey: "pengembalian", params: { jabatan: "${$.$.formData.jabatan}", jenis: "${$.$.formData.jenis}" }, defaultValue: "${NUMBER|0|INTEGER}" },
                },
            ],
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    FORM_CHILD: {
        section: "Workflows",
        description: "FORM_CHILD adalah field untuk mengelola banyak item bersarang (nested) dalam satu form — user bisa add/edit/delete item secara dinamis, dengan support auto-fill, split task, dan scan barcode.",
        long: "FORM_CHILD merupakan Recursive Field pada [[fields|Fields]] di sebuah FORM. Field ini menyisipkan sub-form (form di dalam form) yang bisa menampung banyak item secara dinamis. Setiap item memiliki sub-field (`fields`) tersendiri yang bisa diisi, diedit, dan dihapus oleh user. Cocok untuk purchase order, invoice, daftar kerusakan, rekap absensi, dan kasus lain yang membutuhkan input banyak baris dalam satu form. Mendukung auto-fill via `executeRef`, pengisian nilai otomatis via `insertDefault`/`outsideVal`, serta split task per item.",
        meta: { documents: "—", indexed: false },
        notes: [
            recursiveNote,
            { kind: "warn", text: "Sebelum menggunakan FORM_CHILD, wajib membuat dokumen [[itemlist_style|ItemListStyle]] terlebih dahulu di collection `itemlist_style`. Isi `insertStyle` dan `loadStyle` dengan nilai `key` dari dokumen tersebut — tanpa ItemListStyle, FORM_CHILD tidak akan berfungsi." },
            { kind: "note", text: "Gunakan [[ITEM_LIST]] atau [[CARD_LIST]] jika data berasal dari database (read-only dengan update per field). FORM_CHILD lebih cocok untuk input banyak item baru yang sepenuhnya diisi oleh user." },
            { kind: "tip", text: "Tidak semua schema pada field ini wajib dipakai. Apabila schema tidak dibutuhkan, hapus saja agar dokumen tidak terlalu panjang." },
        ],
        fields: [
            ...baseFieldsFor("FORM_CHILD"),
            ...asGroup([
                f("insertStyle", "string", false, "Referensikan ke `key` dari dokumen [[itemlist_style|ItemListStyle]] — mengatur tampilan dan behavior saat user menambah item baru. ItemListStyle mendefinisikan template judul/subtitle, formula total, auto-fill refs, validasi item, dan nilai dari form induk.", { eg: { insertStyle: "purchase_order_items" } }),
                f("insertTag", "string", false, "Key field yang dijadikan tag/identifier unik saat proses insert item. Diisi dengan `key` dari field lain di form yang nilainya unik per insert — biasanya field bertipe TEXT dengan `copyFrom` berisi [[replacer_overview|DATETIME replacer]] (contoh: `${DATETIME|0.0.0.0.0.0|yyyyMMddHHmmssSS}`), atau field yang menggunakan [[number_ai|NumberAI]].", { eg: { insertTag: "itemTransId" } }),
                f("loadStyle", "string", false, "Referensikan ke `key` dari dokumen [[itemlist_style|ItemListStyle]] — mengatur tampilan daftar item yang sudah ada. Biasanya diisi nilai yang sama dengan `insertStyle`.", { eg: { loadStyle: "purchase_order_items" } }),
                f("loadTag", "string", false, "Tag/identifier yang digunakan saat proses load/tampilkan items.", { eg: { loadTag: "loadItems" } }),
                f("itemAddType", "string", false, "Tipe penambahan item. `SCAN` — user menambah item dengan scan QR/barcode. `SELECTION` — user memilih item dari daftar pilihan.", { enumValues: ["SCAN", "SELECTION"], eg: { itemAddType: "SELECTION" } }),
            ], "FORM_CHILD"),
            ...asGroup(recursiveFields, "Recursive Fields"),
        ],
        example: [
            {
                copyFrom: "${DATETIME|0.0.0.0.0.0|yyyyMMddHHmmssSS}",
                label: "Item Transfer Id",
                type: "TEXT",
                key: "itemTransId",
                isRequired: true,
                isDisabled: true,
                isVisibleExport: false,
                isVisible: true,
                order: 0,
            },
            {
                key: "produk_dikirim",
                label: "Produk yang akan Dikirim",
                type: "FORM_CHILD",
                sortByTitle: true,
                order: 1,
                isRequired: true,
                isDisabled: false,
                title: "{nama_produk}",
                subtitle: "Satuan Utama : {satuan_utama}",
                insertStyle: "itemtransfer",
                insertTag: "itemTransId",
                loadStyle: "itemtransfer",
                loadTag: "itemTransId",
                showTotal: false,
                itemAddable: true,
                itemUpdatable: true,
                itemDeletable: true,
                fields: [
                    { label: "Nama Produk", type: "DROPDOWN", key: "nama", isRequired: true, isDisabled: false, isVisible: true, order: 1, triggerOption: ["nomor_batch"], triggerReload: ["satuan"] },
                    { label: "Nomor Batch", type: "DROPDOWN", key: "nomor_batch", isRequired: true, isDisabled: false, isVisible: true, ref: { reportType: "reports", collection: "reportStock", searchKey: "nomor_batch", params: { periode_stock: "${DATETIME|0.0.0.0.0.0|yyyy-MM}", nama: "${$.$.formData.nama}", type: "Barang Jadi" } }, order: 3 },
                    { label: "Satuan", type: "TEXT", key: "satuan", isRequired: true, isDisabled: true, isVisible: true, ref: { reportType: "reports", collection: "reportStock", searchKey: "satuan", params: { periode_stock: "${DATETIME|0.0.0.0.0.0|yyyy-MM}", nama: "${$.$.formData.nama}", type: "Barang Jadi" } }, order: 3 },
                    { label: "Qty yang akan dikirim", type: "NUMBER", key: "qty_dikirim", isRequired: true, isDisabled: false, isVisible: true, order: 4 },
                    { label: "Pengiriman", type: "DROPDOWN", key: "pengiriman", isRequired: true, isDisabled: false, isVisible: true, reportType: "masterdata", collection: "mdPengiriman", searchKey: "nama_checklist", order: 5 },
                ],
            },
        ],
        example2Label: "Contoh dengan executeRef — auto-fill nama dan departemen dari employee_id.",
        example2: {
            key: "attendance_records",
            label: "Rekam Absensi",
            type: "FORM_CHILD",
            order: 3,
            isRequired: false,
            isDisabled: false,
            showTotal: true,
            itemAddable: true,
            itemUpdatable: true,
            itemDeletable: true,
            executeRef: ["employee_name", "department"],
            insertStyle: "attendance_records",
            loadStyle: "attendance_records",
            fields: [
                { key: "employee_id", type: "TEXT", label: "ID Karyawan", order: 1 },
                { key: "employee_name", type: "TEXT", label: "Nama Karyawan", isDisabled: true, ref: { reportType: "reports", collection: "employees", searchKey: "employee_id", returnKey: "name" }, order: 2 },
                { key: "department", type: "TEXT", label: "Departemen", isDisabled: true, ref: { reportType: "reports", collection: "employees", searchKey: "employee_id", returnKey: "department" }, order: 3 },
                { key: "check_in_time", type: "DATETIME", label: "Jam Masuk", pickers: ["TIME"], order: 4 },
                { key: "status", type: "DROPDOWN", label: "Status", options: ["Present", "Late", "Absent", "Leave"], order: 5 },
            ],
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    CARD_LIST: {
        section: "Workflows",
        description: "CARD_LIST menampilkan daftar item berbentuk kartu (card/grid) yang diambil dari database, dan setiap kartu bisa memiliki sub-field yang dapat diupdate (Recursive Field v2).",
        long: "CARD_LIST merupakan Recursive Field versi kedua (v2) pada [[fields|Fields]] di sebuah FORM. Field ini mengambil data dari database (via `reportType`/`collection`/`params`/`searchKeys`), lalu menampilkannya sebagai daftar kartu. Setiap kartu memiliki judul (`keyTitle`/`title`) dan sub-judul (`keySubTitle`/`subtitle`), serta dapat memiliki sub-field (`fields`) yang bisa diisi atau diubah oleh user. Cocok dipakai untuk checklist, daftar item terstruktur, atau data yang perlu di-review dan diupdate per-baris. [[ITEM_LIST]] adalah pendahulunya (v1) dengan tampilan tabel.",
        meta: { documents: "—", indexed: false },
        notes: [
            recursiveNote,
            { kind: "tip", text: "Tidak semua schema pada field ini wajib dipakai. Apabila schema tidak dibutuhkan, hapus saja agar dokumen tidak terlalu panjang." },
            { kind: "note", text: "`searchKeys` berbeda dengan `params`: `params` digunakan sebagai filter query ke database (menentukan *baris mana* yang diambil), sedangkan `searchKeys` digunakan untuk mencocokkan/memetakan data yang sudah ada di form dengan data dari database (mirip lookup/join)." },
            { kind: "tip", text: "Tambahkan `\"ref\": {}` (objek kosong) pada konfigurasi CARD_LIST agar daftar kartu langsung dimuat otomatis saat form pertama kali dibuka. Tanpa `ref: {}`, CARD_LIST tidak akan berjalan secara otomatis." },
        ],
        fields: [
            ...baseFieldsFor("CARD_LIST"),
            ...asGroup(recursiveFields, "Recursive Fields"),
        ],
        example: {
            key: "checklistBefore",
            label: "Checklist Before",
            type: "CARD_LIST",
            value: null,
            order: 7,
            isRequired: false,
            isDisabled: false,
            aggregateShow: true,
            title: "{content}",
            subtitle: "",
            reportType: "masterdata",
            collection: "cipMatrix",
            searchKeys: {
                content: "${$.$.formData.content}",
            },
            params: {
                model: "${$.form9.formData.matrix}",
                label: "Before",
            },
            groupedByTitle: false,
            ref: {},
            fieldKey: "content",
            firstTitle: "",
            keyTitle: "content",
            keySubTitle: "",
            showTotal: false,
            itemAddable: false,
            itemUpdatable: true,
            itemDeletable: false,
            fields: [
                {
                    label: "Content",
                    type: "TEXT",
                    key: "content",
                    isRequired: false,
                    isDisabled: true,
                    isVisibleExport: false,
                    isVisible: false,
                    order: 4,
                },
                {
                    label: "Checklist",
                    type: "RADIO",
                    key: "checklist",
                    options: ["Yes", "No"],
                    isRequired: false,
                    isDisabled: false,
                    isVisible: true,
                    order: 4,
                },
            ],
        },
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    AUDIT: {
        section: "Workflows",
        description: "AUDIT adalah salah satu jenis (type) field pada FORM.",
        long: "AUDIT merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi AUDIT akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("AUDIT"),
        example: exampleFor("AUDIT"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    AUDIT_WEB: {
        section: "Workflows",
        description: "AUDIT_WEB adalah salah satu jenis (type) field pada FORM.",
        long: "AUDIT_WEB merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi AUDIT_WEB akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("AUDIT_WEB"),
        example: exampleFor("AUDIT_WEB"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    CONTACT: {
        section: "Workflows",
        description: "CONTACT adalah salah satu jenis (type) field pada FORM.",
        long: "CONTACT merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi CONTACT akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("CONTACT"),
        example: exampleFor("CONTACT"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    DIFFERENT_VIEW: {
        section: "Workflows",
        description: "DIFFERENT_VIEW adalah salah satu jenis (type) field pada FORM.",
        long: "DIFFERENT_VIEW merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi DIFFERENT_VIEW akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("DIFFERENT_VIEW"),
        example: exampleFor("DIFFERENT_VIEW"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },

    NFC: {
        section: "Workflows",
        description: "NFC adalah salah satu jenis (type) field pada FORM.",
        long: "NFC merupakan salah satu nilai `type` pada [[fields|Fields]] di sebuah FORM. (Konten dokumentasi NFC akan dilengkapi kemudian.)",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Tidak semua schema pada fields ini wajib dipakai. Apabila schema tidak dibutuhkan, biasakan untuk langsung menghapusnya agar dokumen tidak terlalu panjang." },
        ],
        fields: baseFieldsFor("NFC"),
        example: exampleFor("NFC"),
        indexes: [],
        relations: [
            { field: "type", to: "fields", kind: "belongs to" },
        ],
    },
}

/** Overview page untuk Numeric Fields — ditampilkan sebagai halaman referensi di section Fields Schema. */
export const numericFieldsCollection: Record<string, Collection> = {
    numeric_fields: {
        section: "Fields Schema",
        description: "Numeric Fields adalah schema bersama untuk field bertipe angka — NUMBER, DECIMAL, dan CURRENCY semuanya menggunakan property ini.",
        long: "Numeric Fields merupakan kumpulan property yang dibagi oleh semua field bertipe angka: [[NUMBER]], [[DECIMAL]], dan [[CURRENCY]]. Property-property ini mengontrol formatting tampilan (pemisah ribuan/desimal, jumlah digit desimal), validasi nilai (min/max), satuan, dan formula kalkulasi otomatis. [[CURRENCY]] menambahkan satu property tambahan (`currency`) untuk simbol mata uang.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "Schema di bawah adalah properti yang dimiliki bersama oleh [[NUMBER]], [[DECIMAL]], dan [[CURRENCY]]. CURRENCY menambahkan property `currency` di atasnya." },
            { kind: "tip", text: "Untuk angka bulat tanpa desimal gunakan [[NUMBER]], angka dengan desimal gunakan [[DECIMAL]], dan nilai uang/mata uang gunakan [[CURRENCY]]." },
        ],
        fields: numericFields,
        example: {
            key: "harga",
            label: "Harga Satuan",
            type: "CURRENCY",
            order: 1,
            currency: "Rp",
            decimalCount: 0,
            thousandSep: ".",
            decimalSep: "",
            min: 0,
            formula: "${qty} * ${unitPrice}",
        },
        indexes: [],
        relations: [],
    },
}

/** Overview page untuk Recursive Fields — ditampilkan sebagai halaman induk di section Fields Schema. */
export const recursiveFieldsCollection: Record<string, Collection> = {
    recursive_fields: {
        section: "Fields Schema",
        description: "Recursive Fields adalah kategori field yang dapat mengandung sub-field (fields) di dalamnya — yaitu ITEM_LIST, CARD_LIST, dan FORM_CHILD.",
        long: "Recursive Fields merupakan field-field khusus yang mewarisi kelas dasar `RecursiveField`. Berbeda dengan field biasa yang hanya menyimpan satu nilai skalar (teks, angka, tanggal, dll), Recursive Field dapat menampung kumpulan sub-field (`fields`) yang membentuk struktur data bersarang. Ada tiga jenis Recursive Field: [[ITEM_LIST]] (v1, tampilan tabel/list), [[CARD_LIST]] (v2, tampilan card/grid yang lebih modern), dan [[FORM_CHILD]] (sub-form tersemat — biasanya satu instance). Ketiga jenis ini berbagi schema dasar yang ditampilkan di halaman ini, kemudian masing-masing menambahkan properti spesifiknya sendiri.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "Schema di bawah adalah properti yang dimiliki bersama oleh semua Recursive Field. Setiap jenis ([[ITEM_LIST]], [[CARD_LIST]], [[FORM_CHILD]]) juga memiliki properti tambahannya sendiri — lihat halaman masing-masing." },
            { kind: "tip", text: "Untuk daftar item berbentuk tabel gunakan [[ITEM_LIST]], tampilan card/grid gunakan [[CARD_LIST]], dan untuk sub-form tersemat (satu instance) gunakan [[FORM_CHILD]]." },
        ],
        fields: recursiveFields,
        example: {
            key: "checklistItems",
            label: "Checklist Harian",
            type: "CARD_LIST",
            order: 5,
            isRequired: false,
            fields: [
                { label: "Status", type: "RADIO", key: "status", options: ["OK", "Not OK"], isRequired: true, order: 1 },
                { label: "Catatan", type: "TEXT_AREA", key: "catatan", isRequired: false, order: 2 },
            ],
            insertDefault: { status: "" },
            outsideVal: { workflowId: "workflowId" },
        },
        indexes: [],
        relations: [],
    },
}
