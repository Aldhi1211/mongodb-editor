import type { LucideIcon } from "lucide-react"

export type FieldKind = "objectid" | "string" | "number" | "boolean" | "date" | "array" | "object"

export interface Field {
    name: string
    kind: FieldKind
    required: boolean
    description: string
    depth?: number
    enumValues?: string[]
    of?: string
    /** optional group label — renders a divider row above this field in the schema table */
    group?: string
    /** optional per-field example (shown as JSON in the eye-icon modal) */
    eg?: unknown
}

export interface IndexDef { name: string; keys: string[]; unique: boolean; note?: string }
export interface Relation { field: string; to: string; kind: string }
export interface Note { kind: "note" | "tip" | "warn"; text: string }
/** One step in a collection's process flow, rendered as a numbered card in a FlowChart. */
export interface FlowStep { title: string; detail?: string }

export interface Collection {
    section: string
    description: string
    long: string
    meta: { documents: string; indexed: boolean }
    notes: Note[]
    /** optional left-to-right process flow, rendered as a FlowChart in the Overview section */
    flow?: FlowStep[]
    fields: Field[]
    example: unknown
    example2?: unknown
    example2Label?: string
    example3?: unknown
    example3Label?: string
    example4?: unknown
    example4Label?: string
    indexes: IndexDef[]
    relations: Relation[]
}

export interface SectionDef { id: string; label: string; icon: LucideIcon; collections: string[] }

export interface SearchItem {
    type: "collection" | "field"
    id: string
    title: string
    sub: string
    section?: string
    kind?: FieldKind
}
