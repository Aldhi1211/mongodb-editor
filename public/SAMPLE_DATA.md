# Sample Excel File untuk Testing

Berikut adalah contoh data yang bisa Anda copy-paste ke Excel untuk testing:

## Sheet 1: WorkflowInfo
```
Property        | Value                    | Description
workflow_id     | employee_registration    | Employee registration workflow
workflow_name   | Employee Registration    | Employee registration process
notif_worker    | 5                        | Number of notification workers
vsb_status      | ACTIVE                   | Workflow visibility status
```

## Sheet 2: Nodes
```
node_id | node_name           | node_type | icon_url      | order | show_btns      | hide_for_cms | loc_title      | submit_type | groups    | loc_required | loc_preview
node_1  | Personal Information| FORM      | form-icon.png | 1     | SUBMIT,SAVE    | false        | Personal Info  | SUBMIT      | USER,ADMIN| true         | true
node_2  | Document Upload     | FORM      | doc-icon.png  | 2     | SUBMIT         | false        | Documents      | SUBMIT      | USER      | false        | true
node_3  | HR Review           | APPROVAL  | review-icon.png| 3     | APPROVE,REJECT | true         | HR Review      | APPROVE     | ADMIN     | false        | true
```

## Sheet 3: Fields
```
node_id | field_key        | field_label         | field_type  | is_required | is_visible | placeholder                | order | options                      | min_value | max_value | decimal_count | default_value | description
node_1  | employee_id      | Employee ID         | TEXT        | true        | true       | Enter employee ID          | 1     |                              |           |           |               |               | Unique employee identifier
node_1  | full_name        | Full Name           | TEXT        | true        | true       | Enter full name            | 2     |                              |           |           |               |               | Employee full name
node_1  | email            | Email Address       | TEXT        | true        | true       | Enter email address        | 3     |                              |           |           |               |               | Employee email
node_1  | phone            | Phone Number        | PHONENUMBER | true        | true       | Enter phone number         | 4     |                              |           |           |               |               | Employee contact number
node_1  | department       | Department          | DROPDOWN    | true        | true       |                            | 5     | IT,HR,Finance,Marketing,Sales|           |           |               |               | Employee department
node_1  | position         | Position            | TEXT        | true        | true       | Enter job position         | 6     |                              |           |           |               |               | Job position
node_1  | start_date       | Start Date          | DATETIME    | true        | true       | Select start date          | 7     |                              |           |           |               |               | Employment start date
node_1  | salary           | Base Salary         | CURRENCY    | true        | true       | Enter base salary          | 8     |                              | 0         | 50000000  | 0             |               | Employee base salary
node_1  | employment_type  | Employment Type     | RADIO       | true        | true       |                            | 9     | Full-time,Part-time,Contract |           |           |               |               | Type of employment
node_1  | skills           | Skills              | CHECKBOX    | false       | true       |                            | 10    | Programming,Design,Management,Communication,Leadership|           |           |               |               | Employee skills
node_1  | bio              | Biography           | TEXT_AREA   | false       | true       | Tell us about yourself     | 11    |                              |           |           |               |               | Employee biography
node_2  | profile_photo    | Profile Photo       | IMAGE       | true        | true       |                            | 1     |                              |           |           |               |               | Employee profile photo
node_2  | id_card          | ID Card Copy        | IMAGE       | true        | true       |                            | 2     |                              |           |           |               |               | Copy of ID card
node_2  | cv_document      | CV Document         | LOUNGE_FILE | true        | true       |                            | 3     |                              |           |           |               |               | Employee CV document
node_2  | certificates     | Certificates        | ITEM_LIST   | false       | true       |                            | 4     |                              |           |           |               |               | List of certificates
node_3  | review_notes     | Review Notes        | TEXT_AREA   | false       | true       | Add review comments        | 1     |                              |           |           |               |               | HR review notes
node_3  | approval_status  | Approval Status     | DROPDOWN    | true        | true       |                            | 2     | Approved,Rejected,Pending    |           |           |               |               | Final approval status
```

## Cara Menggunakan:

1. Buat file Excel baru (.xlsx)
2. Buat 3 sheet dengan nama: WorkflowInfo, Nodes, Fields
3. Copy data di atas ke masing-masing sheet (sesuai headernya)
4. Save file Excel
5. Upload ke Workflow Generator
6. Klik "Generate Workflow"

## Tips:
- Pastikan nama sheet persis sama (case-sensitive)
- Jangan ada baris kosong di antara data
- Boolean values gunakan "true" atau "false"
- Multiple values dipisah dengan koma (,)
- Order menentukan urutan tampilan
