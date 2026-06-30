import { f } from "../helpers"
import type { Collection } from "../types"

export const replacerCollections: Record<string, Collection> = {
    number_ai: {
        section: "ETC",
        description: "NUMBERAI adalah collection penyimpan counter (penghitung) untuk penomoran otomatis (auto-increment). Tiap dokumen adalah satu counter yang dibedakan oleh `key`, dipakai lewat replacer `${NUMBERAI|digit|key}`.",
        long:
            "Collection `number_ai` menyimpan counter untuk auto-increment. Satu dokumen = satu counter, dibedakan oleh `key`. Nilai counter ada di `current`, dan `basedOnSubmit` menentukan kapan counter dinaikkan. Counter ini dipakai dari template lewat replacer [[rp_numberai|NUMBERAI]] (`${NUMBERAI|digit|key}`), serta dinaikkan saat submit melalui `updateNumberAI` pada [[form|FORM]].\n\n" +
            "Ada dua mode. Pada `basedOnSubmit: false` (normal), counter langsung di-`$inc` begitu replacer dipanggil — risikonya, bila form ditampilkan tapi tidak jadi disubmit, nomor terlanjur naik sehingga muncul nomor bolong (gap). Pada `basedOnSubmit: true`, saat replacer dipanggil (preview/buka form) sistem hanya mengembalikan `current` apa adanya tanpa menaikkannya; counter baru naik ketika form benar-benar disubmit (lewat `updateNumberAI` di node Form/Validation). Mode ini mencegah nomor bolong.\n\n" +
            "Contoh: dokumen dengan `current: 60` dan `basedOnSubmit: true` berarti counter sudah dipakai 60 kali submit; saat form dibuka berikutnya replacer menampilkan 60 (di-zero-pad sesuai digit), lalu menjadi 61 ketika submit berhasil.",
        meta: { documents: "—", indexed: true },
        notes: [
            { kind: "warn", text: "Dokumen counter harus dibuat dulu sebelum dipakai. Replacer [[rp_numberai|NUMBERAI]] TIDAK membuat dokumennya secara otomatis — bila `key` belum ada, `findOneByKey` mengembalikan null lalu pengecekan `isBasedOnSubmit()` memicu NullPointerException, sehingga replacer gagal (jadi null). Minimal isi `key`, `current`, dan `_vsb: \"ACTIVE\"`." },
            { kind: "note", text: "`basedOnSubmit: false` (normal): counter di-`$inc` saat replacer dipanggil. Cepat, tapi bisa menimbulkan nomor bolong jika form tidak jadi disubmit." },
            { kind: "note", text: "`basedOnSubmit: true`: replacer hanya menampilkan `current` saat dipanggil; counter naik hanya saat submit via `updateNumberAI` pada [[form|FORM]]/[[validation|Validation]]. Mencegah nomor bolong." },
            { kind: "warn", text: "`_vsb` harus `ACTIVE` agar counter terbaca — query penaikan nomor memfilter `_vsb = ACTIVE`." },
            { kind: "note", text: "Field `recycle`, `recycleTimeSetting`, dan `recycleNumber` dipakai cronjob `recycleNumberAi()` untuk mereset counter secara terjadwal (mis. tiap bulan/tahun)." },
        ],
        flow: [
            { title: "Buat dokumen counter", detail: "`{ key, current, basedOnSubmit, _vsb: \"ACTIVE\" }` di `number_ai`." },
            { title: "Pakai di field form", detail: "Replacer `${NUMBERAI|5|key}` pada field." },
            { title: "Daftarkan di updateNumberAI", detail: "Masukkan `key` ke `updateNumberAI` node Form/Validation." },
            { title: "Naik saat submit", detail: "Counter `$inc` hanya ketika submit berhasil." },
        ],
        fields: [
            f("_id", "string", true, "Unique document identifier."),
            f("key", "string", true, "Nama counter. Dirujuk oleh replacer `${NUMBERAI|digit|key}` dan oleh `updateNumberAI` pada [[form|FORM]].", { eg: { key: "penerimaan_kopi" } }),
            f("current", "number", true, "Nilai counter saat ini (NumberLong). Nomor berikutnya = `current + 1` saat dinaikkan.", { eg: { current: 60 } }),
            f("basedOnSubmit", "boolean", false, "Mode penambahan. `false` → naik saat replacer dipanggil; `true` → naik hanya saat submit via `updateNumberAI`."),
            f("_vsb", "string", false, "Status counter. Harus `ACTIVE` agar terbaca.", { enumValues: ["ACTIVE", "PAUSED"] }),
            f("recycle", "boolean", false, "Aktifkan reset counter terjadwal (cronjob `recycleNumberAi`)."),
            f("recycleTimeSetting", "string", false, "Pengaturan jadwal reset (mis. bulanan/tahunan)."),
            f("recycleNumber", "number", false, "Nilai counter setelah di-reset."),
            f("createAt", "number", false, "Waktu dibuat (epoch milidetik)."),
            f("updateAt", "number", false, "Waktu diperbarui (epoch milidetik)."),
        ],
        example: {
            key: "penerimaan_kopi",
            current: 60,
            basedOnSubmit: true,
            _vsb: "ACTIVE",
            createAt: 1629429763824,
            updateAt: 1629429763825,
        },
        indexes: [
            { name: "key_1", keys: ["key"], unique: true },
        ],
        relations: [
            { field: "key", to: "form", kind: "referenced by (updateNumberAI)" },
            { field: "key", to: "rp_numberai", kind: "referenced by (replacer)" },
        ],
    },
}
