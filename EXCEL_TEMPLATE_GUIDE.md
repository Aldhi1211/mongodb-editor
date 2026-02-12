# Workflow Generator Excel Template

## Deskripsi
Template ini memungkinkan Anda membuat workflow secara otomatis dari file Excel. Template terdiri dari 3 sheet:

## 1. Sheet "WorkflowInfo"
Berisi informasi dasar workflow.

| Column | Description | Example | Required |
|--------|-------------|---------|----------|
| Property | Nama properti | workflow_id | Yes |
| Value | Nilai properti | sample_workflow | Yes |
| Description | Deskripsi properti | Unique identifier for workflow | No |

### Properties yang didukung:
- **workflow_id**: ID unik workflow (string)
- **workflow_name**: Nama workflow yang ditampilkan (string)
- **notif_worker**: Jumlah worker notifikasi (number, default: 5)
- **vsb_status**: Status visibility (ACTIVE/INACTIVE, default: ACTIVE)

## 2. Sheet "Nodes"
Berisi definisi node/step dalam workflow.

| Column | Description | Example | Required |
|--------|-------------|---------|----------|
| node_id | ID unik node | node_1 | Yes |
| node_name | Nama node | Registration Form | Yes |
| node_type | Tipe node | FORM | Yes |
| icon_url | URL icon | default-icon.png | No |
| order | Urutan node | 1 | Yes |
| show_btns | Tombol yang ditampilkan | SUBMIT,SAVE | No |
| hide_for_cms | Sembunyikan di CMS | false | No |
| loc_title | Judul lokalisasi | Registration | No |
| submit_type | Tipe submit | SUBMIT | No |
| groups | Group akses | USER,ADMIN | No |
| loc_required | Lokasi wajib | true | No |
| loc_preview | Preview lokasi | true | No |

### Node Types yang didukung:
- **FORM**: Node form input
- **VALIDATION**: Node validasi
- **APPROVAL**: Node persetujuan
- **NOTIFICATION**: Node notifikasi

## 3. Sheet "Fields"
Berisi definisi field untuk setiap node.

| Column | Description | Example | Required |
|--------|-------------|---------|----------|
| node_id | ID node pemilik | node_1 | Yes |
| field_key | ID unik field | full_name | Yes |
| field_label | Label field | Full Name | Yes |
| field_type | Tipe field | TEXT | Yes |
| is_required | Wajib diisi | true | No |
| is_visible | Terlihat di UI | true | No |
| placeholder | Placeholder text | Enter your name | No |
| order | Urutan field | 1 | No |
| options | Opsi (untuk dropdown/radio/checkbox) | Male,Female,Other | No |
| min_value | Nilai minimum | 0 | No |
| max_value | Nilai maksimum | 100 | No |
| decimal_count | Jumlah desimal | 2 | No |
| default_value | Nilai default | | No |
| description | Deskripsi field | User full name | No |

### Field Types yang didukung:

#### Text Fields:
- **TEXT**: Input text biasa
- **TEXT_AREA**: Text area multi-line
- **PHONENUMBER**: Input nomor telepon

#### Selection Fields:
- **DROPDOWN**: Dropdown selection
- **RADIO**: Radio button selection
- **CHECKBOX**: Checkbox selection

#### Numeric Fields:
- **NUMBER**: Input angka
- **CURRENCY**: Input mata uang (gunakan decimal_count)
- **DECIMAL**: Input desimal (gunakan decimal_count)

#### Special Fields:
- **DATETIME**: Date/time picker
- **IMAGE**: Upload gambar
- **MAP**: Input lokasi map
- **LOUNGE_FILE**: Upload file
- **ITEM_LIST**: List item dinamis

## Contoh Template Lengkap

### WorkflowInfo Sheet:
```
Property        | Value              | Description
workflow_id     | employee_onboard   | Employee onboarding workflow
workflow_name   | Employee Onboarding| Employee onboarding process
notif_worker    | 5                  | Number of notification workers
vsb_status      | ACTIVE             | Workflow visibility status
```

### Nodes Sheet:
```
node_id | node_name        | node_type | icon_url     | order | show_btns    | groups
node_1  | Personal Info    | FORM      | form.png     | 1     | SUBMIT,SAVE  | USER,ADMIN
node_2  | Documents        | FORM      | docs.png     | 2     | SUBMIT       | USER
node_3  | HR Approval      | APPROVAL  | approve.png  | 3     | APPROVE,REJECT| ADMIN
```

### Fields Sheet:
```
node_id | field_key | field_label | field_type | is_required | options           | order
node_1  | full_name | Full Name   | TEXT       | true        |                   | 1
node_1  | email     | Email       | TEXT       | true        |                   | 2
node_1  | gender    | Gender      | RADIO      | true        | Male,Female,Other | 3
node_1  | birth_date| Birth Date  | DATETIME   | true        |                   | 4
node_2  | id_card   | ID Card     | IMAGE      | true        |                   | 1
node_2  | cv        | CV Document | LOUNGE_FILE| true        |                   | 2
```

## Tips Penggunaan:

1. **Pastikan node_id di sheet Nodes sesuai dengan node_id di sheet Fields**
2. **Gunakan koma (,) untuk memisahkan multiple values** (contoh: options, show_btns, groups)
3. **Order akan menentukan urutan tampilan** - field dengan order lebih kecil akan muncul lebih dulu
4. **Boolean values** gunakan "true" atau "false" (case-insensitive)
5. **Field type harus sesuai** dengan yang didukung sistem
6. **Untuk field numeric** (CURRENCY, DECIMAL), gunakan decimal_count untuk mengatur jumlah desimal

## Validasi:

Generator akan memvalidasi:
- ✅ Format Excel (.xlsx/.xls)
- ✅ Keberadaan 3 sheet wajib
- ✅ Node_id yang valid di kedua sheet
- ✅ Field type yang didukung
- ✅ Format data yang benar

Jika ada error, pesan error akan ditampilkan dengan detail masalah yang ditemukan.
