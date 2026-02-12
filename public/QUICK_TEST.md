# Quick Test Excel Data

Jika Anda mengalami error "permission problems", coba data sederhana ini:

## WorkflowInfo Sheet
```
Property        | Value
workflow_id     | test_workflow
workflow_name   | Test Workflow
```

## Nodes Sheet  
```
node_id | node_name     | node_type | order
node_1  | Basic Form    | FORM      | 1
```

## Fields Sheet
```
node_id | field_key | field_label | field_type | is_required | order
node_1  | name      | Full Name   | TEXT       | true        | 1
node_1  | email     | Email       | TEXT       | true        | 2
```

## Langkah-langkah:

1. **Buat Excel baru** (.xlsx)
2. **Buat 3 sheet** dengan nama persis: `WorkflowInfo`, `Nodes`, `Fields`
3. **Copy data di atas** ke masing-masing sheet
4. **Tutup Excel sepenuhnya** (sangat penting!)
5. **Upload file** ke generator
6. **Klik Generate Workflow**

## Tips Menghindari Error:

### ✅ DO (Lakukan):
- Gunakan format .xlsx (bukan .xls)
- Tutup Excel sepenuhnya sebelum upload
- Pastikan nama sheet persis sama (case-sensitive)
- Gunakan data minimal seperti contoh di atas dulu
- Simpan file di folder yang mudah diakses

### ❌ DON'T (Jangan):
- Jangan biarkan Excel terbuka saat upload
- Jangan gunakan spasi di awal/akhir nama sheet
- Jangan biarkan ada baris kosong di tengah data
- Jangan upload file yang sedang dibuka program lain

## Jika Masih Error:

1. **Coba browser lain** (Chrome/Edge/Firefox)
2. **Restart browser** dan coba lagi
3. **Buat file Excel baru** dengan data minimal
4. **Check console browser** (F12) untuk error detail
5. **Coba file size lebih kecil** (hapus data yang tidak perlu)

Data minimal di atas sudah cukup untuk membuat workflow sederhana dengan 1 node dan 2 field.
