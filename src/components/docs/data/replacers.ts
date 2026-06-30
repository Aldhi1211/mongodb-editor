import { f } from "../helpers"
import type { Collection } from "../types"

/* Satu halaman per replacer (prefix `${PREFIX|...}`) + satu halaman aturan sintaks.
   Semua menjadi turunan `replacer_overview`. Id memakai prefix `rp_` agar tidak
   bentrok dengan id field type (mis. DATETIME, NUMBER, AUDIT). */

/** Relation standar: menautkan halaman replacer kembali ke overview Replacer. */
const rpRel = { field: "${...}", to: "replacer_overview", kind: "sintaks Replacer" }

export const replacersCollections: Record<string, Collection> = {
    replacer_syntax: {
        section: "Replacer",
        description: "Aturan sintaks umum yang berlaku untuk semua replacer: format dasar, pemisah parameter, escape untuk template bersarang, dan shortcut konteks.",
        long:
            "Semua replacer ditulis dengan pola `${PREFIX|p1|p2|...}` — sebuah prefix diikuti parameter yang dipisah tanda `|`. Prefix menentukan replacer mana yang dipakai (pemetaan prefix → class ada di BcUtil). Bila prefix tidak dikenal, sistem jatuh ke default [[field_reference|Field reference]] (`ReplacerField`).\n\n" +
            "Saat sebuah replacer dipakai di dalam parameter replacer lain (bersarang), pemisah `|` akan bentrok dengan pemisah milik replacer luar. Untuk itu, template bagian dalam memakai `&&` atau `//` sebagai pengganti `|`; keduanya nanti di-replace kembali menjadi `|` saat diproses.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "`${PREFIX|p1|p2|...}` — format dasar: prefix + parameter dipisah `|`." },
            { kind: "note", text: "`&&` atau `//` — pengganti `|` untuk template bersarang, agar tidak bentrok dengan pemisah replacer luar. Di dalam kode di-replace kembali jadi `|`." },
            { kind: "note", text: "`__` (dua underscore) — otomatis diubah menjadi spasi pada hasil." },
            { kind: "tip", text: "`$` = pakai nilai default (mis. workflowId/nodeId task saat ini). `$.$.` = wildcard untuk workflowId & nodeId task yang sedang berjalan. Lihat [[field_reference|Field reference]]." },
        ],
        fields: [
            f("${PREFIX|p1|p2}", "string", true, "Format dasar: prefix menentukan replacer, parameter dipisah `|`."),
            f("&& // ", "string", false, "Pengganti `|` untuk template bersarang (di-replace kembali jadi `|`)."),
            f("__", "string", false, "Dua underscore → diubah menjadi spasi."),
            f("$", "string", false, "Nilai default — mis. workflowId/nodeId task saat ini."),
            f("$.$.", "string", false, "Wildcard → workflowId & nodeId task yang sedang berjalan."),
        ],
        example: {
            dasar: "${DATETIME|0.0.0.0.0.0|dd-MM-yyyy}",
            bersarang: "${IFNULL|${DATETIME&&0.0.0.0.0.0&&dd-MM-yyyy}|-}",
            spasi: "${...}__hari → '... hari'",
        },
        indexes: [],
        relations: [rpRel],
    },

    field_reference: {
        section: "Replacer",
        description: "Field reference adalah replacer default (ReplacerField) untuk mengambil nilai field dari task. Bentuknya `${workflowId.nodeId.property.field}`, mis. `${$.$.formData.key}`.",
        long:
            "`${$.$.formData.key}` adalah Field reference, yaitu replacer default dan paling umum untuk mengambil nilai field dari sebuah task.\n\n" +
            "Formatnya berpola titik: `workflowId.nodeId.property.field`. Contoh `$.$.formData.key` dipecah menjadi empat bagian: `$` (workflowId), `$` (nodeId), `formData` (property), dan `key` (field).\n\n" +
            "Tanda `$` adalah shortcut untuk \"current context\": ketika sebuah bagian bernilai `$`, sistem mengisinya dengan default — yaitu `workflowId`/`nodeId` task yang sedang berjalan. Jadi Anda tidak perlu menulis nama workflow dan node secara eksplisit. Dengan kata lain, `${$.$.formData.key}` berarti: ambil nilai field `key` dari `formData` pada task di workflow & node yang sedang berjalan ini.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "Format empat bagian dipisah titik: `workflowId.nodeId.property.field`. `property` umumnya `formData`, tapi bisa juga `metadata`, `userInfo`, dll." },
            { kind: "tip", text: "`$` = workflow/node saat ini. Jadi `${$.$.formData.key}` setara dengan bentuk eksplisit `${workflowHarianReal.form6.formData.key}` ketika task sedang berjalan di workflow `workflowHarianReal` node `form6`. Lihat [[replacer_syntax|Aturan Sintaks]]." },
        ],
        flow: [
            { title: "workflowId — `$`", detail: "Default: workflowId task saat ini." },
            { title: "nodeId — `$`", detail: "Default: nodeId task saat ini." },
            { title: "property — `formData`", detail: "Properti task, mis. `formData`/`metadata`/`userInfo`." },
            { title: "field — `key`", detail: "Nama field yang nilainya diambil." },
        ],
        fields: [],
        example: {
            template: "${$.$.formData.key}",
            arti: "Ambil field 'key' dari formData task di workflow & node saat ini",
            setaraDengan: "${workflowHarianReal.form6.formData.key}",
        },
        indexes: [],
        relations: [rpRel],
    },

    // ── B. Tanggal & Waktu ──────────────────────────────────────────────
    rp_datetime: {
        section: "Replacer",
        description: "DATETIME — menghitung dan memformat tanggal dengan offset (tahun.bulan.hari.jam.menit.detik, boleh minus).",
        long: "DATETIME (`ReplacerDatetime`) menghasilkan tanggal yang dihitung dari sebuah tanggal awal ditambah/dikurangi sebuah offset, lalu diformat sesuai pola yang diberikan. Jika tanggal awal tidak diisi, dipakai waktu sekarang.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "`offset` berformat `tahun.bulan.hari.jam.menit.detik` dan boleh bernilai minus, mis. `0.0.-5.0.0.0` = 5 hari lalu." },
            { kind: "tip", text: "`unit` opsional: `WEEKOFMONTH`, `WEEKOFYEAR`, `TIMEINMILLIS`. Lihat juga [[rp_datetimeid|DATETIMEID]] untuk locale Indonesia." },
        ],
        fields: [
            f("offset", "string", true, "Selisih waktu `thn.bln.hari.jam.menit.detik` (boleh minus).", { eg: { offset: "0.0.-5.0.0.0" } }),
            f("writeFormat", "string", true, "Format output tanggal.", { eg: { writeFormat: "yyyy-MM-dd" } }),
            f("tglAwal", "string", false, "Tanggal awal (template `${...}`). Kosong → pakai waktu sekarang."),
            f("readFormat", "string", false, "Format untuk membaca `tglAwal`."),
            f("unit", "string", false, "Satuan khusus.", { enumValues: ["WEEKOFMONTH", "WEEKOFYEAR", "TIMEINMILLIS"] }),
        ],
        example: {
            hariIni: "${DATETIME|0.0.0.0.0.0|dd-MM-yyyy}",
            limaHariLalu: "${DATETIME|0.0.-5.0.0.0|yyyy-MM-dd}",
            tambahSatuHari: "${DATETIME|0.0.1.0.0.0|yyyy-MM-dd|${$.$.formData.tgl}|yyyy-MM-dd}",
        },
        indexes: [],
        relations: [rpRel],
    },

    rp_datetimeid: {
        section: "Replacer",
        description: "DATETIMEID — sama persis dengan DATETIME, tetapi dipaksa Locale Indonesia (id-ID) dan timezone Asia/Jakarta (WIB).",
        long: "DATETIMEID (`ReplacerDateTimeId`) berperilaku identik dengan [[rp_datetime|DATETIME]], namun output-nya selalu memakai Locale Indonesia dan timezone Asia/Jakarta. Pakai ini bila butuh nama bulan/hari berbahasa Indonesia serta WIB yang konsisten.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Gunakan format dengan `MMMM`/`EEEE` untuk mendapat nama bulan/hari Indonesia (mis. \"Januari\", \"Senin\")." },
        ],
        fields: [
            f("offset", "string", true, "Selisih waktu `thn.bln.hari.jam.menit.detik` (boleh minus)."),
            f("writeFormat", "string", true, "Format output tanggal (locale id-ID)."),
            f("tglAwal", "string", false, "Tanggal awal (template `${...}`). Kosong → sekarang."),
            f("readFormat", "string", false, "Format untuk membaca `tglAwal`."),
        ],
        example: {
            template: "${DATETIMEID|0.0.0.0.0.0|EEEE, dd MMMM yyyy}",
            hasil: "Senin, 26 Juni 2026",
        },
        indexes: [],
        relations: [rpRel],
    },

    rp_datediff: {
        section: "Replacer",
        description: "DATEDIFF — selisih antara dua tanggal, dalam satuan tertentu atau pola custom.",
        long: "DATEDIFF (`ReplacerDateDiff`) menghitung selisih dua tanggal. Hasilnya bisa dalam satuan tunggal (`DAYS`/`HOURS`/`MINUTES`/`SECONDS`) atau memakai pola custom yang menggabungkan beberapa satuan.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "`unit` = `DAYS`/`HOURS`/`MINUTES`/`SECONDS`, atau pakai pola custom dengan token `$d` (hari), `$h` (jam), `$m` (menit), `$s` (detik)." },
        ],
        fields: [
            f("tgl1", "string", true, "Tanggal pertama (template `${...}`)."),
            f("tgl2", "string", true, "Tanggal kedua (template `${...}`)."),
            f("format1", "string", true, "Format parsing `tgl1`."),
            f("format2", "string", true, "Format parsing `tgl2`."),
            f("unit", "string", false, "Satuan hasil.", { enumValues: ["DAYS", "HOURS", "MINUTES", "SECONDS"] }),
            f("custom", "string", false, "Pola custom, mis. `$d__hari__$h__jam`."),
            f("valueCustom", "string", false, "Nilai tambahan untuk pola custom."),
        ],
        example: {
            hari: "${DATEDIFF|${$.$.formData.mulai}|${$.$.formData.selesai}|yyyy-MM-dd|yyyy-MM-dd|DAYS}",
            custom: "pola \"$d__hari__$h__jam\" → \"3 hari 5 jam\"",
        },
        indexes: [],
        relations: [rpRel],
    },

    rp_monthdiff: {
        section: "Replacer",
        description: "MONTHDIFF — selisih dua tanggal dihitung dalam satuan bulan.",
        long: "MONTHDIFF (`ReplacerMonthDiff`) menghitung selisih dua tanggal dalam jumlah bulan.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("tgl1", "string", true, "Tanggal pertama (template `${...}`)."),
            f("tgl2", "string", true, "Tanggal kedua (template `${...}`)."),
            f("format1", "string", true, "Format parsing `tgl1`."),
            f("format2", "string", true, "Format parsing `tgl2`."),
        ],
        example: {
            template: "${MONTHDIFF|${$.$.formData.mulai}|${$.$.formData.selesai}|yyyy-MM-dd|yyyy-MM-dd}",
        },
        indexes: [],
        relations: [rpRel],
    },

    rp_db: {
        section: "Replacer",
        description: "DB (Date Between) — menghasilkan daftar/array semua tanggal antara dua tanggal (inklusif).",
        long: "DB (`ReplacerDateBetween`) mengembalikan array berisi setiap tanggal mulai dari tanggal awal sampai tanggal akhir (inklusif), masing-masing diformat sesuai pola hasil.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("tglAwal", "string", true, "Tanggal awal (template `${...}`)."),
            f("tglAkhir", "string", true, "Tanggal akhir (template `${...}`)."),
            f("formatBaca", "string", true, "Format parsing tanggal masukan."),
            f("formatHasil", "string", true, "Format tiap tanggal pada array hasil."),
        ],
        example: {
            template: "${DB|2026-01-01|2026-01-03|yyyy-MM-dd|dd/MM}",
            hasil: ["01/01", "02/01", "03/01"],
        },
        indexes: [],
        relations: [rpRel],
    },

    // ── C. Angka & Kalkulasi ────────────────────────────────────────────
    rp_number: {
        section: "Replacer",
        description: "NUMBER — mengubah string menjadi angka bertipe tertentu.",
        long: "NUMBER (`ReplacerNumber`) melakukan casting sebuah nilai string menjadi angka dengan tipe yang ditentukan.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("value", "string", true, "Nilai yang akan diubah jadi angka."),
            f("type", "string", false, "Tipe angka. Default `FLOAT`.", { enumValues: ["LONG", "INTEGER", "DOUBLE", "FLOAT"] }),
        ],
        example: { template: "${NUMBER|123|INTEGER}", hasil: 123 },
        indexes: [],
        relations: [rpRel],
    },

    rp_numform: {
        section: "Replacer",
        description: "NUMFORM — membulatkan angka ke jumlah desimal tertentu (HALF_UP) dan menetapkan tipenya.",
        long: "NUMFORM (`ReplacerNumericFormat`) membulatkan sebuah angka ke jumlah angka desimal tertentu memakai pembulatan HALF_UP, sekaligus menetapkan tipe angkanya.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("angka", "string", true, "Angka yang akan dibulatkan (template `${...}`)."),
            f("type", "string", false, "Tipe angka hasil.", { enumValues: ["LONG", "INTEGER", "DOUBLE", "FLOAT"] }),
            f("desimal", "number", false, "Jumlah angka di belakang koma."),
        ],
        example: { template: "${NUMFORM|${$.$.formData.nilai}|DOUBLE|2}", arti: "2 angka desimal" },
        indexes: [],
        relations: [rpRel],
    },

    rp_decform: {
        section: "Replacer",
        description: "DECFORM — memformat angka dengan pemisah ribuan.",
        long: "DECFORM (`ReplacerDecimalFormat`) memformat sebuah angka agar memakai pemisah ribuan.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("angka", "string", true, "Angka yang akan diformat (template `${...}`)."),
        ],
        example: { template: "${DECFORM|1500000}", hasil: "1,500,000" },
        indexes: [],
        relations: [rpRel],
    },

    rp_formula: {
        section: "Replacer",
        description: "FORMULA — operasi matematika dua operand, dengan opsi persen task & converter.",
        long: "FORMULA (`ReplacerFormula`) melakukan satu operasi matematika antara dua operand. Berbeda dengan [[rp_count|COUNT]] yang bisa berantai, FORMULA hanya dua operand tetapi memiliki fitur tambahan seperti persen task dan converter.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Untuk operasi berantai (banyak operand), gunakan [[rp_count|COUNT]]." },
        ],
        fields: [
            f("a", "string", true, "Operand pertama (template `${...}`)."),
            f("operator", "string", true, "Operator matematika.", { enumValues: ["+", "-", "*", "/"] }),
            f("b", "string", true, "Operand kedua (template `${...}`)."),
            f("converter", "string", false, "Converter hasil (mis. tipe angka). `null` jika tidak dipakai."),
            f("task", "string", false, "Opsi persen task."),
            f("operatorExtra", "string", false, "Operator tambahan opsional."),
        ],
        example: { template: "${FORMULA|${$.$.formData.harga}|*|${$.$.formData.qty}|null}", arti: "harga × qty" },
        indexes: [],
        relations: [rpRel],
    },

    rp_count: {
        section: "Replacer",
        description: "COUNT — operasi matematika berantai dengan banyak operand.",
        long: "COUNT (`ReplacerCount`) melakukan operasi matematika berantai antar banyak operand secara berurutan. Cocok ketika operand lebih dari dua; untuk fitur persen/converter pakai [[rp_formula|FORMULA]].",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("operand & operator", "string", true, "Urutan operand dan operator berselang-seling: `${a}|+|${b}|-|${c}|...`."),
        ],
        example: { template: "${COUNT|${a}|+|${b}|+|${c}}", arti: "a + b + c" },
        indexes: [],
        relations: [rpRel],
    },

    // ── D. ItemList ─────────────────────────────────────────────────────
    rp_itemlist: {
        section: "Replacer",
        description: "ITEMLIST — mengolah ItemList untuk generate file (PDF); mengembalikan baris template (BcRowModel).",
        long: "ITEMLIST (`ReplacerItemList`) memproses sebuah field [[ITEM_LIST]] menjadi baris-baris template untuk pembuatan file PDF.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Untuk export Excel pakai [[rp_itemlistxls|ITEMLISTXLS]]; untuk teks/notifikasi pakai [[rp_itemlisttext|ITEMLISTTEXT]]." },
        ],
        fields: [
            f("cellIndex", "string", true, "Indeks sel/kolom pada template."),
            f("propertyVar", "string", true, "Nama property/variabel item yang diambil."),
            f("default", "string", false, "Nilai default bila kosong."),
            f("source", "string", true, "Sumber ItemList: `wId.nId.formData.field`."),
        ],
        example: { template: "${ITEMLIST|0|nama|-|$.$.formData.items}" },
        indexes: [],
        relations: [rpRel, { field: "source", to: "ITEM_LIST", kind: "references" }],
    },

    rp_itemlistxls: {
        section: "Replacer",
        description: "ITEMLISTXLS — seperti ITEMLIST tetapi khusus export Excel, dengan opsi tipe sel (Number/Double/Integer).",
        long: "ITEMLISTXLS (`ReplacerItelmListXls`) sama seperti [[rp_itemlist|ITEMLIST]] namun ditujukan untuk export Excel, dan dapat menetapkan tipe sel angka.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("cellIndex", "string", true, "Indeks sel/kolom."),
            f("propertyVar", "string", true, "Property item yang diambil."),
            f("default", "string", false, "Nilai default bila kosong."),
            f("source", "string", true, "Sumber ItemList: `wId.nId.formData.field`."),
            f("cellType", "string", false, "Tipe sel Excel.", { enumValues: ["Number", "Double", "Integer"] }),
        ],
        example: { template: "${ITEMLISTXLS|2|nominal|0|$.$.formData.items|Number}" },
        indexes: [],
        relations: [rpRel, { field: "source", to: "ITEM_LIST", kind: "references" }],
    },

    rp_itemlisttext: {
        section: "Replacer",
        description: "ITEMLISTTEXT — mengubah ItemList menjadi teks (untuk notifikasi/pesan), mendukung HTML atau plain text.",
        long: "ITEMLISTTEXT (`ReplacerItemlistText`) merangkai isi sebuah [[ITEM_LIST]] menjadi teks, baik berformat HTML maupun plain text, untuk dipakai pada notifikasi atau pesan.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("il", "string", true, "ItemList sumber (template `${...}`)."),
            f("tagLabel", "string", false, "Tag/format untuk label."),
            f("tagKey", "string", false, "Tag/format untuk key."),
            f("tagAll", "string", false, "Tag/format pembungkus keseluruhan."),
            f("label", "string", false, "Label tambahan."),
            f("total", "string", false, "Tampilkan total."),
        ],
        example: { template: "${ITEMLISTTEXT|${$.$.formData.items}|<b>|<i>|<p>|Daftar|total}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_itemlistcount: {
        section: "Replacer",
        description: "ITEMLISTCOUNT — menjumlahkan (SUM) nilai sebuah key dari semua item di ItemList.",
        long: "ITEMLISTCOUNT (`ReplacerItemlistCount`) menjumlahkan nilai sebuah key dari seluruh item dalam [[ITEM_LIST]].",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("il", "string", true, "ItemList sumber (template `${...}`)."),
            f("key", "string", true, "Key item yang dijumlahkan."),
            f("type", "string", false, "Tipe angka hasil.", { enumValues: ["LONG", "INTEGER", "DOUBLE", "FLOAT"] }),
        ],
        example: { template: "${ITEMLISTCOUNT|${$.$.formData.items}|nominal|DOUBLE}", arti: "total semua nominal" },
        indexes: [],
        relations: [rpRel],
    },

    rp_ilsubs: {
        section: "Replacer",
        description: "ILSUBS — selisih dua ItemList: buang item dari list-1 yang juga ada di list-2 (berdasarkan primaryKey).",
        long: "ILSUBS (`ReplacerItemListSubstraction`) mengurangi sebuah ItemList dengan ItemList lain — item pada list pembanding yang ada di list validate akan dibuang, dicocokkan lewat `primaryKey`.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("ilPembanding", "string", true, "ItemList sumber (template `${...}`)."),
            f("ilValidate", "string", true, "ItemList pembanding untuk dikurangkan (template `${...}`)."),
            f("primaryKey", "string", true, "Key pencocokan antar item."),
        ],
        example: { template: "${ILSUBS|${$.$.formData.semua}|${$.$.formData.terpakai}|id}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_filteril: {
        section: "Replacer",
        description: "FILTERIL — menyaring item ItemList berdasarkan field (buang yang null, atau yang sama dengan nilai tertentu).",
        long: "FILTERIL (`ReplacerFilterItemList`) menyaring isi sebuah [[ITEM_LIST]]: membuang item yang field-nya null, atau yang nilainya sama dengan nilai validasi tertentu.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Sering dipadukan dengan [[rp_ilndi|ILNDI]] untuk menyaring lalu menambah data." },
        ],
        fields: [
            f("il", "string", true, "ItemList sumber (template `${...}`)."),
            f("fieldPrefix", "string", true, "Field yang dijadikan acuan filter."),
            f("needFill", "string", false, "Mode pengisian (`true`/`false`)."),
            f("valueValidate", "string", false, "Nilai pembanding untuk membuang item."),
        ],
        example: { template: "${FILTERIL|${$.$.formData.item}|outstanding|false|0}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_combineil: {
        section: "Replacer",
        description: "COMBINEIL — menggabungkan beberapa ItemList menjadi satu (+ menjumlahkan total, opsi sorting).",
        long: "COMBINEIL (`ReplacerCombineItemList`) menggabungkan beberapa [[ITEM_LIST]] menjadi satu list, dengan opsi menjumlahkan total dan mengurutkan hasil.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("needFill", "string", true, "Mode pengisian (`true`/`false`)."),
            f("itemLists", "string", true, "Daftar ItemList yang digabung: `${il1}|${il2}|...`."),
            f("sort", "string", false, "Opsi sorting (mis. `true`)."),
        ],
        example: { template: "${COMBINEIL|false|${il1}|${il2}|true}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_ilnuvsby: {
        section: "Replacer",
        description: "ILNUVSBY — membersihkan data visibility (vsby) dari ItemList agar tidak ikut tersimpan ke DB.",
        long: "ILNUVSBY (`ReplacerItemListVSBY`) menghapus data visibility (`vsby`) dari sebuah [[ITEM_LIST]]. Data visibility hanya dipakai untuk tampilan Android, sehingga tidak perlu ikut disimpan ke database.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("il", "string", true, "ItemList sumber (template `${...}`)."),
            f("needFill", "string", false, "Mode pengisian (`true`/`false`)."),
        ],
        example: { template: "${ILNUVSBY|${$.$.formData.items}|false}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_ilndi: {
        section: "Replacer",
        description: "ILNDI (New Data Input) — menambah field/data baru ke tiap item ItemList + menyalin nilai antar key dengan default.",
        long: "ILNDI (`ReplacerItemListNewDataInput`) menambahkan field/data baru ke setiap item dalam [[ITEM_LIST]], dan dapat menyalin nilai dari satu key ke key lain dengan nilai default. Sering dipadukan dengan [[rp_filteril|FILTERIL]].",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "Format penambahan data per key: `key::keyValue::default` atau `key::value`." },
        ],
        fields: [
            f("il", "string", true, "ItemList sumber (template `${...}`)."),
            f("needFill", "string", false, "Mode pengisian (`true`/`false`)."),
            f("dataBaru", "string", true, "Satu atau lebih definisi data: `key::keyValue::default/false|key::value|...`."),
        ],
        example: {
            template: "${ILNDI|${FILTERIL&&${$.$.formData.item}&&outstanding&&false&&0}|false|realisasi::totalRealisasi::0|realisasiBarang::0}",
        },
        indexes: [],
        relations: [rpRel],
    },

    // ── E. Array ────────────────────────────────────────────────────────
    rp_ats: {
        section: "Replacer",
        description: "ATS (Array To String) — menggabungkan array menjadi string yang dipisah koma.",
        long: "ATS (`ReplacerArrayToString`) mengubah sebuah array menjadi string dengan pemisah koma.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("array", "string", true, "Array sumber (template `${...}`)."),
        ],
        example: { template: "${ATS|${$.$.formData.tags}}", hasil: "a, b" },
        indexes: [],
        relations: [rpRel],
    },

    rp_countarr: {
        section: "Replacer",
        description: "COUNTARR — menghitung jumlah elemen sebuah array.",
        long: "COUNTARR (`ReplacerCountArrayValues`) mengembalikan jumlah elemen (`.size()`) dari sebuah array.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("array", "string", true, "Array sumber (template `${...}`)."),
        ],
        example: { template: "${COUNTARR|${$.$.formData.tags}}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_updatearray: {
        section: "Replacer",
        description: "UPDATEARRAY — menggabungkan (COMBINE) atau menghapus (REMOVE) elemen ke/dari array (otomatis unik).",
        long: "UPDATEARRAY (`ReplacerUpdateArray`) menggabungkan atau menghapus elemen antar dua array, dengan hasil yang otomatis dibuat unik.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("arr1", "string", true, "Array pertama (template `${...}`)."),
            f("arr2", "string", true, "Array kedua (template `${...}`)."),
            f("mode", "string", true, "Operasi.", { enumValues: ["COMBINE", "REMOVE"] }),
        ],
        example: { template: "${UPDATEARRAY|${arr1}|${arr2}|COMBINE}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_updatearrvalue: {
        section: "Replacer",
        description: "UPDATEARRVALUE — mentransformasi tiap elemen array lewat replacer lain.",
        long: "UPDATEARRVALUE (`ReplacerUpdateArrayValue`) menjalankan sebuah template replacer pada setiap elemen array, sehingga tiap nilai dapat diolah/diformat ulang.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "Template bagian dalam memakai `&&` sebagai pengganti `|`. Lihat [[replacer_syntax|Aturan Sintaks]]." },
        ],
        fields: [
            f("array", "string", true, "Array sumber (template `${...}`)."),
            f("template", "string", true, "Template replacer yang dijalankan per elemen."),
            f("key", "string", true, "Key yang dipakai dalam template per elemen."),
        ],
        example: {
            template: "${UPDATEARRVALUE|${$.form1.formData.tanggalCuti}|${DATETIME&&0.0.0.0.0.0&&dd-MM-yyyy&&${$.$.formData.tgl}&&yyyy-MM-dd}|tgl}",
        },
        indexes: [],
        relations: [rpRel],
    },

    rp_splitvaluearr: {
        section: "Replacer",
        description: "SPLITVALUEARR — memecah tiap elemen array, lalu mengambil bagian pada index tertentu.",
        long: "SPLITVALUEARR (`ReplacerSplitValueArray`) memecah setiap elemen array berdasarkan regex, lalu mengambil potongan pada index tertentu dari masing-masing elemen.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("array", "string", true, "Array sumber (template `${...}`)."),
            f("regex", "string", true, "Pemisah (regex)."),
            f("index", "number", true, "Index potongan yang diambil."),
        ],
        example: { template: "${SPLITVALUEARR|${$.$.formData.list}|-|0}" },
        indexes: [],
        relations: [rpRel],
    },

    // ── F. Manipulasi String ────────────────────────────────────────────
    rp_split: {
        section: "Replacer",
        description: "SPLIT — memecah string berdasarkan regex, lalu mengambil bagian pada index tertentu.",
        long: "SPLIT (`ReplacerSplitValue`) memecah sebuah string berdasarkan pemisah (regex) dan mengambil potongan pada index yang ditentukan.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "tip", text: "`__` pada pemisah berarti spasi. Lihat [[replacer_syntax|Aturan Sintaks]]." },
        ],
        fields: [
            f("value", "string", true, "String sumber (template `${...}`)."),
            f("regex", "string", true, "Pemisah (regex)."),
            f("index", "number", true, "Index potongan yang diambil."),
            f("dataType", "string", false, "Tipe data hasil."),
        ],
        example: { template: "${SPLIT|${$.$.formData.fullname}|__|0}", arti: "ambil kata pertama" },
        indexes: [],
        relations: [rpRel],
    },

    rp_replacevalue: {
        section: "Replacer",
        description: "REPLACEVALUE — find-and-replace dalam string (regex). EMPTY = ganti menjadi string kosong.",
        long: "REPLACEVALUE (`ReplacerValue`) mengganti bagian string yang cocok dengan regex menjadi nilai pengganti. Gunakan `EMPTY` sebagai pengganti untuk menghapus (mengganti dengan \"\").",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("value", "string", true, "String sumber (template `${...}`)."),
            f("regex", "string", true, "Pola yang dicari (regex)."),
            f("pengganti", "string", true, "Nilai pengganti. `EMPTY` = string kosong."),
        ],
        example: { template: "${REPLACEVALUE|${$.form9.formData.matrix}|\\.0|EMPTY}", arti: "buang \".0\"" },
        indexes: [],
        relations: [rpRel],
    },

    rp_ifnull: {
        section: "Replacer",
        description: "IFNULL — mengembalikan nilai default jika nilai utama null.",
        long: "IFNULL (`ReplacerIfNull`) mengembalikan nilai default apabila nilai utama bernilai null.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("value", "string", true, "Nilai utama (template `${...}`)."),
            f("defaultValue", "string", true, "Nilai pengganti bila `value` null."),
        ],
        example: { template: "${IFNULL|${$.$.formData.catatan}|-}" },
        indexes: [],
        relations: [rpRel],
    },

    // ── G. Objek ────────────────────────────────────────────────────────
    rp_bo: {
        section: "Replacer",
        description: "BO (Build Object) — membangun objek/HashMap dari pasangan key-value.",
        long: "BO (`ReplacerBuildAnObject`) menyusun sebuah objek (HashMap) dari pasangan key-value yang diberikan.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "Tiap pasangan ditulis `key::${value}` dan dipisah `|`." },
        ],
        fields: [
            f("pairs", "string", true, "Pasangan key-value: `key1::${val1}|key2::${val2}`."),
        ],
        example: { template: "${BO|nama::${$.$.formData.nama}|umur::${$.$.formData.umur}}" },
        indexes: [],
        relations: [rpRel],
    },

    // ── H. Logika Kondisi ───────────────────────────────────────────────
    rp_validation: {
        section: "Replacer",
        description: "VALIDATION — seperti IF/CASE: mengembalikan sebuah nilai berdasarkan kondisi (memakai struktur ValidationCondition).",
        long: "VALIDATION (`ReplacerValidation`) bekerja seperti IF/CASE. Ia mengevaluasi daftar `routes` (memakai struktur [[validationcondition|ValidationCondition]]) dan mengembalikan `result` dari kondisi pertama yang cocok; bila tidak ada yang cocok, mengembalikan `defaultResult`.",
        meta: { documents: "—", indexed: false },
        notes: [
            { kind: "note", text: "Berbeda dengan node [[validation|Validation]] yang menghasilkan rute/arah alur, replacer ini menghasilkan sebuah nilai." },
        ],
        fields: [
            f("json", "object", true, "JSON berisi `routes` (kondisi → `result`) dan `defaultResult`."),
        ],
        example: {
            template: "${VALIDATION|{\"routes\":[{\"field\":\"${$.$.formData.status}\",\"op\":\"EQUALS\",\"value\":\"approved\",\"result\":\"SESUAI\"}],\"defaultResult\":\"TIDAK SESUAI\"}}",
        },
        indexes: [],
        relations: [rpRel, { field: "json.routes", to: "validationcondition", kind: "references" }],
    },

    // ── I. Integrasi Eksternal & Khusus ─────────────────────────────────
    rp_officer: {
        section: "Replacer",
        description: "OFFICER — mengambil data user/petugas dari DB berdasarkan userId, menghasilkan { i: userId, t: nama }.",
        long: "OFFICER (`ReplacerOfficer`) mengambil data user/petugas dari database berdasarkan `userId`, dan mengembalikan objek `{ i: userId, t: nama }`.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("userId", "string", true, "ID user/petugas (template `${...}`)."),
        ],
        example: { template: "${OFFICER|${$.$.userInfo.id}}", hasil: { i: "userId", t: "Nama User" } },
        indexes: [],
        relations: [rpRel],
    },

    rp_numberai: {
        section: "Replacer",
        description: "NUMBERAI — menghasilkan nomor urut otomatis (auto increment) ber-padding nol, untuk nomor dokumen/invoice.",
        long: "NUMBERAI (`ReplacerNumberAI`) menghasilkan nomor urut otomatis yang bertambah (auto increment), diisi nol di depan (padding) sesuai jumlah digit. Cocok untuk nomor invoice/dokumen. Konfigurasi penomorannya disimpan di collection [[number_ai|NUMBERAI]].",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("digit", "number", true, "Jumlah digit (padding nol)."),
            f("key", "string", true, "Key NUMBERAI yang dipakai."),
        ],
        example: { template: "${NUMBERAI|5|invoiceNo}", hasil: "00042" },
        indexes: [],
        relations: [rpRel, { field: "key", to: "number_ai", kind: "references" }],
    },

    rp_mapdistance: {
        section: "Replacer",
        description: "MAP_DISTANCE — menghitung jarak (meter) antara dua titik GPS memakai formula Haversine.",
        long: "MAP_DISTANCE (`ReplacerMapDistance`) menghitung jarak dalam meter antara dua titik koordinat GPS menggunakan formula Haversine.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("lokasi1", "string", true, "Titik GPS pertama (template `${...}`)."),
            f("lokasi2", "string", true, "Titik GPS kedua (template `${...}`)."),
        ],
        example: { template: "${MAP_DISTANCE|${$.$.formData.lokasiA}|${$.$.formData.lokasiB}}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_facematch: {
        section: "Replacer",
        description: "FACEMATCH — memanggil API face matching untuk membandingkan dua foto; hasilnya verified/distance.",
        long: "FACEMATCH (`ReplacerFaceMatch`) memanggil API face matching untuk membandingkan dua foto dan mengembalikan hasil kecocokan (verified/distance).",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("fotoSumber", "string", true, "Foto sumber (template `${...}`)."),
            f("fotoValidasi", "string", true, "Foto pembanding (template `${...}`)."),
            f("specificKey", "string", false, "Key spesifik hasil yang diambil."),
        ],
        example: { template: "${FACEMATCH|${$.$.formData.fotoKtp}|${$.$.formData.selfie}|verified}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_bcimage: {
        section: "Replacer",
        description: "BCIMAGE — mengonversi file gambar (FileUploadResponse) untuk di-embed di file generated, dengan ukuran.",
        long: "BCIMAGE (`ReplacerBcImage`) mengonversi file gambar (FileUploadResponse) agar bisa di-embed pada file yang di-generate, dengan lebar dan tinggi tertentu.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("field", "string", true, "Field gambar sumber (template `${...}`)."),
            f("width", "number", true, "Lebar gambar."),
            f("height", "number", true, "Tinggi gambar."),
        ],
        example: { template: "${BCIMAGE|${$.$.formData.foto}|200|200}" },
        indexes: [],
        relations: [rpRel],
    },

    rp_audit: {
        section: "Replacer",
        description: "AUDIT — mengolah data field tipe AUDIT untuk file generation (dengan cache template).",
        long: "AUDIT (`ReplacerAudit`) memproses data field bertipe [[AUDIT]] untuk keperluan pembuatan file, memanfaatkan cache template.",
        meta: { documents: "—", indexed: false },
        notes: [],
        fields: [
            f("cellIndex", "string", true, "Indeks sel/kolom pada template."),
            f("propertyVar", "string", true, "Property data audit yang diambil."),
            f("default", "string", false, "Nilai default bila kosong."),
            f("source", "string", true, "Sumber: `wId.nId.formData.field`."),
        ],
        example: { template: "${AUDIT|0|nilai|-|$.$.formData.auditField}" },
        indexes: [],
        relations: [rpRel, { field: "source", to: "AUDIT", kind: "references" }],
    },
}
