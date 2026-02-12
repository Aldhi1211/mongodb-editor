// src/hooks/workflowData.ts (misalnya kamu simpan di folder hooks)

export type FieldType =
    | "TEXT"
    | "TEXT_AREA"
    | "PHONENUMBER"
    | "DROPDOWN"
    | "RADIO"
    | "CHECKBOX"
    | "DATETIME"
    | "NUMBER"
    | "CURRENCY"
    | "DECIMAL"
    | "IMAGE"
    | "MAP"
    | "LOUNGE_FILE"
    | "ITEM_LIST";

export const FIELD_TYPES: FieldType[] = [
    "TEXT",
    "TEXT_AREA",
    "PHONENUMBER",
    "DROPDOWN",
    "RADIO",
    "CHECKBOX",
    "DATETIME",
    "NUMBER",
    "CURRENCY",
    "DECIMAL",
    "IMAGE",
    "MAP",
    "LOUNGE_FILE",
    "ITEM_LIST"
];

export interface BaseFieldItem {
    key: string; // Unik identifier untuk field
    label: string; // Nama field yang akan ditampilkan di UI
    type: FieldType; // Jenis field, misalnya "TEXT", "DROPDOWN", dll.
    isRequired: boolean; // Untuk field yang wajib diisi
    isDisabled?: boolean; // Untuk field yang tidak bisa diubah
    aggregateShow?: boolean; // Untuk field yang bisa di-aggregate
    placeholder?: string; // Untuk field yang memiliki placeholder
    order?: number; // Untuk mengatur urutan field
    isHDSV?: boolean; // is Hidden Dont Show Value
    isVisible?: boolean; // Untuk field yang bisa disembunyikan di UI
    isVisibleExport?: boolean; // Untuk field yang bisa disembunyikan di export
    ref?: OptionFieldItemBase; // Untuk field yang memiliki referensi ke field lain
    isReplace?: boolean;
    value?: any; // Untuk field yang memiliki nilai awal
    copyFrom?: string; // Untuk field yang bisa menyalin nilai dari field lain
    fields: FieldItem[]; // Daftar field yang ada dalam item list
}

export interface TextFieldItem extends BaseFieldItem {
    type: "TEXT";
}

export interface TextAreaFieldItem extends BaseFieldItem {
    type: "TEXT_AREA";
}

export interface PhoneNumberFieldItem extends BaseFieldItem {
    type: "PHONENUMBER";
}

export interface NumericFieldItemBase extends BaseFieldItem {
    triggerFormula?: boolean; // Untuk field yang memiliki formula
    min?: number; // Untuk field yang memiliki nilai minimum
    max?: number; // Untuk field yang memiliki nilai maksimum
}

export interface NumberFieldItem extends NumericFieldItemBase {
    type: "NUMBER";
}

export interface CurrencyFieldItem extends NumericFieldItemBase {
    type: "CURRENCY";
    decimalCount?: number; // Jumlah desimal yang ditampilkan
}

export interface DecimalFieldItem extends NumericFieldItemBase {
    type: "DECIMAL";
    decimalCount: number; // Jumlah desimal yang ditampilkan
}

interface OptionFieldItemBase {
    reportType?: string;
    collection?: string; // Nama koleksi untuk referensi
    searchKey?: string; // Kunci untuk pencarian dalam koleksi
    searchKeyAdt?: string; // Kunci untuk pencarian dalam koleksi (ADT)
    options?: string[]; // Opsi yang tersedia untuk field ini
    triggerOption?: string[]; // Opsi yang memicu perubahan pada field lain
    triggerView?: Record<string, string[]>; // Opsi yang memicu perubahan pada tampilan field lain
    params?: Record<string, any>; // Parameter tambahan untuk field ini
    getAllData?: boolean; // Apakah field ini mengambil semua data dari koleksi
    separator?: string; // Separator untuk opsi yang dipilih
}

export interface DropdownFieldItem extends OptionFieldItemBase, BaseFieldItem {
    type: "DROPDOWN";
}

export interface RadioFieldItem extends OptionFieldItemBase, BaseFieldItem {
    type: "RADIO";
}

export interface CheckboxFieldItem extends OptionFieldItemBase, BaseFieldItem {
    type: "CHECKBOX";

}

export interface ImageFieldItem extends BaseFieldItem {
    type: "IMAGE";
    pickers?: string[]; // Misalnya: ["REAR_CAM", "FRONT_CAM", "GALLERY", "SIGN"]
}

export interface MapFieldItem extends BaseFieldItem {
    type: "MAP";
}

export interface LoungeFileFieldItem extends BaseFieldItem {
    type: "LOUNGE_FILE";
    dir?: null;
}

export interface DateTimeFieldItem extends BaseFieldItem {
    type: "DATETIME";
    pickers?: string[]; // Misalnya: ["DATE", "TIME", "MONTH"]
    showFormat?: string; // Format yang ditampilkan di UI
    submitFormat?: string; // Format yang digunakan saat submit
    decodeFormat?: string; // Format yang digunakan saat decode
    min?: string; // Minimum tanggal yang bisa dipilih
    max?: string; // Maksimum tanggal yang bisa dipilih
}

export interface ItemListFieldItem extends BaseFieldItem {
    type: "ITEM_LIST";
    needFill?: boolean; // Apakah field ini perlu diisi
    itemDeletable?: boolean; // Apakah item dalam list bisa dihapus
    itemEditable?: boolean; // Apakah item dalam list bisa diedit
    itemAddable?: boolean; // Apakah item dalam list bisa ditambahkan
    title?: string; // Judul untuk item list
    subtitle?: string; // Subjudul untuk item list
}


export type FieldItem =
    | TextFieldItem
    | TextAreaFieldItem
    | PhoneNumberFieldItem
    | DropdownFieldItem
    | CheckboxFieldItem
    | RadioFieldItem
    | DateTimeFieldItem
    | NumberFieldItem
    | CurrencyFieldItem
    | DecimalFieldItem
    | ImageFieldItem
    | MapFieldItem
    | LoungeFileFieldItem
    | ItemListFieldItem;;



export interface NodeItem {
    id: string;
    name: string;
    iconURL: string;
    order: number;
    type: string;
    _vsb: string;
    showBtns: string[];
    hideForCms: boolean;
    locTitle: string;
    submitType: string;
    groups: string[];
    routing: {
        defaultDest: {
            node: {
                workflowId: string;
                nodeId: string;
            };
        };
    };
    preview: {
        title: string;
        subtitle: string;
    };
    assignment: {
        type: string;
    };
    locRequired: boolean;
    locPreview: boolean;
    fieldsAfterSubmit: any[]; // Bisa diganti lebih spesifik jika kamu tahu struktur field-nya
    fields: FieldItem[];
    reportAccess: {
        byUserGroups: {
            [key: string]: string;
        };
    };
    position: {
        x: number;
        y: number;
    };
}


export interface WorkflowData {
    _id: string;
    name: string;
    notifWorker: number;
    _vsb: string;
    _class: string;
    nodes: NodeItem[]; // 👈 jangan pakai never[]
}


import { useState } from 'react';

export const useWorkflowData = () => {
    const [workflowData, setWorkflowData] = useState<WorkflowData>({
        _id: "workflowOverride",
        name: "Override Task",
        notifWorker: 5,
        _vsb: "ACTIVE",
        nodes: [],
        _class: "biz.byonchat.v2.services.workflow.models.Workflow",
    });

    return { workflowData, setWorkflowData };
};
