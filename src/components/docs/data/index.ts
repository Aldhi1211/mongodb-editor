import { Workflow, BarChart3, Boxes, Wrench, Replace, Layers } from "lucide-react"
import type { Collection, SectionDef } from "../types"
import { workflowsCollections } from "./workflows"
import { reportsCollections } from "./reports"
import { masterdataCollections } from "./masterdata"
import { etcCollections } from "./etc"
import { replacerCollections } from "./replacer"
import { replacersCollections } from "./replacers"
import { fieldTypeCollections, recursiveFieldsCollection, numericFieldsCollection } from "./fieldtypes"

/** Field-type page ids, diurutkan alfabetis untuk sidebar (turunan `fields`). */
const FIELD_TYPE_IDS = Object.keys(fieldTypeCollections).sort()

/** Replacer page ids (Aturan Sintaks + field_reference + tiap `rp_*`), turunan `replacer_overview`. */
const REPLACER_IDS = Object.keys(replacersCollections)

export const SECTIONS: SectionDef[] = [
    { id: "Workflows", label: "Workflows", icon: Workflow, collections: ["workflows", "nodes", "form", "assignment", "fields", ...FIELD_TYPE_IDS, "queryfilters", "overridetask", "triggerviewfield", "autostockhandler", "validation"] },
    { id: "Reports", label: "Reports", icon: BarChart3, collections: ["reports", "countindex", "splitcontent", "splitarraycontent"] },
    { id: "Masterdata", label: "Masterdata", icon: Boxes, collections: ["masterdata"] },
    { id: "Replacer", label: "Replacer", icon: Replace, collections: ["replacer_overview", ...REPLACER_IDS] },
    { id: "ETC", label: "ETC", icon: Wrench, collections: ["restart_jar", "hitesb", "backup_server", "backup_mario", "validationcondition", "itemlist_style", "number_ai"] },
    { id: "FieldsSchema", label: "Fields Schema", icon: Layers, collections: ["recursive_fields", "numeric_fields", "selection"] },
]

/** Pages that are not collection schemas — rendered with custom content. */
export const CUSTOM_PAGES = new Set(["restart_jar", "hitesb", "backup_server", "backup_mario", "replacer_overview"])

export const COLLECTIONS: Record<string, Collection> = {
    ...workflowsCollections,
    ...fieldTypeCollections,
    ...recursiveFieldsCollection,
    ...numericFieldsCollection,
    ...reportsCollections,
    ...masterdataCollections,
    ...replacerCollections,
    ...replacersCollections,
    ...etcCollections,
}

export const ALL_IDS = SECTIONS.flatMap((s) => s.collections)

/** Collections that are a sub-collection of another — rendered indented in the sidebar. */
export const CHILD_OF: Record<string, string> = { nodes: "workflows", form: "nodes", validation: "nodes", countindex: "reports", splitcontent: "reports", splitarraycontent: "reports", assignment: "form", fields: "form", queryfilters: "form", overridetask: "form", triggerviewfield: "form", autostockhandler: "form", DROPDOWN: "fields", LABEL: "fields", CHECKBOX: "fields", RADIO: "fields", TEXT: "fields", TEXT_AREA: "fields", TEXT_NUMBER: "fields", TEXT_JSON: "fields", DECIMAL: "fields", EMAIL: "fields", NUMBER: "fields", MAP: "fields", OFFICER_SELECT: "fields", RATE: "fields", PHONENUMBER: "fields", CURRENCY: "fields", DATETIME: "fields", DATE_MULTIPLE: "fields", IMAGE: "fields", IMAGE_KIT: "fields", VIDEO: "fields", AUDIO: "fields", IMAGE_DRAW: "fields", SCAN_QR: "fields", LOUNGE_FILE: "fields", NESTED_DROPDOWN: "fields", ITEM_LIST: "fields", FORM_CHILD: "fields", CARD_LIST: "fields", AUDIT: "fields", AUDIT_WEB: "fields", CONTACT: "fields", DIFFERENT_VIEW: "fields", NFC: "fields", ...Object.fromEntries(REPLACER_IDS.map((id) => [id, "replacer_overview"])) }

/** How deep a collection sits in the parent chain — drives sidebar indentation. */
export function depthOf(id: string): number {
    let d = 0
    let cur: string | undefined = id
    while (cur && CHILD_OF[cur]) { d++; cur = CHILD_OF[cur] }
    return d
}

export const ANCHORS = [
    { id: "overview", label: "Overview" },
    { id: "schema", label: "Schema" },
    { id: "example", label: "Example document" },
    { id: "indexes", label: "Indexes & relations" },
]

/** Label tampilan untuk id yang tidak rapi bila sekadar di-Title Case-kan. */
const LABEL_OVERRIDES: Record<string, string> = {
    hitesb: "Hit ESB",
    number_ai: "NumberAI",
    itemlist_style: "ItemListStyle",
    validationcondition: "ValidationCondition",
    countindex: "CountIndex",
    splitcontent: "SplitContent",
    splitarraycontent: "SplitArrayContent",
    queryfilters: "QueryFilters",
    overridetask: "OverrideTask",
    triggerviewfield: "TriggerViewField",
    autostockhandler: "AutoStockHandler",
    masterdata: "Masterdata",
    replacer_overview: "Replacer",
    replacer_syntax: "Aturan Sintaks",
    backup_mario: "Backup Kerjaan Mario",
}

/**
 * Ubah id collection menjadi judul yang enak dibaca untuk sidebar/breadcrumb/judul:
 * `backup_server` → "Backup Server", `rp_datetime` → "DATETIME". Id ALL-CAPS (field type) dibiarkan.
 */
export function prettyLabel(id: string): string {
    if (LABEL_OVERRIDES[id]) return LABEL_OVERRIDES[id]
    if (id.startsWith("rp_")) return id.slice(3).toUpperCase()
    if (id === id.toUpperCase()) return id
    return id.split("_").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ")
}
