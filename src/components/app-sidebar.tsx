import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"
import type { NodeItem, FieldItem } from '@/app/builder/data/workflowData';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarTrigger
} from "@/components/ui/sidebar"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Menu items.
const items = [
    {
        title: "Home",
        url: "#",
        icon: Home,
    },
    {
        title: "Inbox",
        url: "#",
        icon: Inbox,
    },
    {
        title: "Calendar",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Search",
        url: "#",
        icon: Search,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
]

const fields: FieldItem[] = [
    {
        isRequired: true,
        label: "Text Field",
        isDisabled: false,
        type: "TEXT",
        key: "text",
        order: 0
    },
    {
        "key": "textArea",
        "label": "Text Area",
        "placeholder": "keterangan",
        "type": "TEXT_AREA",
        "order": 0,
        "isRequired": true,
        "isVisible": true
    },
    {
        "isRequired": true,
        "label": "Phone Number",
        "isDisabled": false,
        "type": "PHONENUMBER",
        "key": "phoneNumber",
        "order": 0
    },
    {
        "isRequired": true,
        "isVisible": true,
        "label": "Decimal",
        "type": "DECIMAL",
        "decimalCount": 2,
        "key": "decimal",
        "isDisabled": false,
        "order": 0,
    },
    {
        "label": "Number Field",
        "type": "NUMBER",
        "key": "number",
        "isRequired": true,
        "isDisabled": false,
        "isVisible": true,
        "order": 0
    },
    {
        "label": "Currency",
        "type": "CURRENCY",
        "key": "currency",
        "isRequired": true,
        "isDisabled": false,
        "isVisible": true,
        "order": 0
    },
    {
        "isRequired": true,
        "label": "Checkbox Opsi",
        "isDisabled": false,
        "type": "CHECKBOX",
        "key": "checkboxOps",
        "options": [
            "Option 1",
            "Option 2"
        ],
        "order": 0
    },
    {
        "isRequired": true,
        "label": "Checkbox Masterdata",
        "isDisabled": false,
        "type": "CHECKBOX",
        "key": "checkbox",
        "reportType": "masterdata",
        "collection": "mdKaryawan",
        "searchKey": "nama_lengkap",
        "order": 0
    },
    {
        isRequired: true,
        label: "Dropdown Masterdata",
        isDisabled: false,
        type: "DROPDOWN",
        key: "dropdownMd",
        reportType: "masterdata",
        collection: "mdKaryawan",
        searchKey: "department",
        order: 0
    },
    {
        "key": "dropdownOps",
        "label": "Dropdown Options",
        "type": "DROPDOWN",
        "isRequired": true,
        "isDisabled": false,
        "aggregateShow": true,
        "placeholder": "--Please Select--",
        "order": 0,
        "options": [
            "Option 1",
            "Option 2"
        ]
    },
    {
        "isRequired": true,
        "label": "Radio Opsi",
        "isDisabled": false,
        "type": "RADIO",
        "key": "radio_ops",
        "options": [
            "BULANAN",
            "HARIAN"
        ],
        "order": 0
    },
    {
        "isRequired": true,
        "label": "Radio MasterData",
        "isDisabled": false,
        "type": "RADIO",
        "key": "radio_md",
        "reportType": "masterdata",
        "collection": "mdKaryawan",
        "searchKey": "department",
        "order": 0
    },
    {
        key: "datetime",
        label: "Datetime (Date)",
        type: "DATETIME",
        isVisible: true,
        pickers: ["DATE"],
        showFormat: "dd-MMM-yyyy",
        submitFormat: "yyyy-MM-dd",
        decodeFormat: "yyyy-MM-dd",
        min: "${DATETIME|-1.0.0.0.0.0|yyyy-MM-dd}",
        max: "${DATETIME|1.0.0.0.0.0|yyyy-MM-dd}",
        isDisabled: false,
        order: 0,
        isRequired: true
    },
    {
        "isRequired": true,
        "value": null,
        "label": "Image",
        "isDisabled": false,
        "type": "IMAGE",
        "pickers": [
            "REAR_CAM",
            "FRONT_CAM",
            "GALLERY",
            "SIGN"
        ],
        "key": "image",
        "order": 0
    },
    {
        "key": "map",
        "label": "Map",
        "type": "MAP",
        "isRequired": false,
        "isDisabled": false,
        "isVisible": true,
        "aggregateShow": true,
        "order": 0
    },
    {
        "label": "File Attachment",
        "type": "LOUNGE_FILE",
        "key": "fileAttachment",
        "isRequired": true,
        "dir": null,
        "isDisabled": false,
        "order": 0
    },
    {
        "key": "itemList",
        "label": "Item list",
        "type": "ITEM_LIST",
        "value": null,
        "isRequired": true,
        "needFill": true,
        "isDisabled": false,
        "title": "Judul : {text_sub_field}",
        "subtitle": "Sub Judul : {text_sub_field}",
        "aggregateShow": true,
        "itemAddable": true,
        "itemDeletable": true,
        "order": 3,
        "fields": [
            {
                "label": "Text Sub Field",
                "type": "TEXT",
                "key": "text_sub_field",
                "isRequired": true,
                "isDisabled": true,
                "isVisibleExport": false,
                "isVisible": true,
                "order": 0
            }
        ]
    }
];

const nodes: NodeItem[] = [
    {
        id: 'form1',
        name: 'Nodes Form',
        iconURL: 'https://ldap.byonchat2.com/iconsolo/barang_masuk/permintaan_pesanan.PNG',
        order: 1,
        type: 'FORM',
        _vsb: 'ACTIVE',
        showBtns: ['CREATE_TASK'],
        hideForCms: true,
        locTitle: 'Nodes Form',
        submitType: 'SUBMIT',
        groups: ['teknisi'],
        routing: {
            defaultDest: {
                node: {
                    workflowId: 'workflowTemplate',
                    nodeId: 'form3',
                },
            },
        },
        preview: {
            title: 'Submit By : ${$.$.userInfo.name}',
            subtitle: 'Serial Number : ${workflowTemplate.form2.formData.serialNumber}',
        },
        assignment: {
            type: 'ALL',
        },
        locRequired: false,
        locPreview: false,
        fieldsAfterSubmit: [],
        fields: [],
        reportAccess: {
            byUserGroups: {
                '*': 'ALL',
            },
        },
        position: {
            x: -75,
            y: -15,
        },
    }
];


export function AppSidebar() {
    return (
        <Sidebar variant="floating" collapsible="icon">
            <SidebarTrigger className="absolute -right-5" />
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Node List</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <Collapsible className="group/collapsible">
                                {nodes.map((node) => (
                                    <SidebarMenuItem key={node.name}>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton asChild>
                                                <a>
                                                    <img className="w-5" src={node.iconURL} alt="Gambar Barang Masuk" />
                                                    <span>{node.name}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent
                                        >
                                            <SidebarMenuSub>
                                                {fields.map((field) => (
                                                    <SidebarMenuSubItem key={field.key}>
                                                        <a>
                                                            <span>{field.label}</span>
                                                        </a>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                ))}
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

export default fields;
