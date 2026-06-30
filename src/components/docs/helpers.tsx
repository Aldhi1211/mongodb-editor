import React from "react"
import type { Field, FieldKind } from "./types"

export const f = (
    name: string,
    kind: FieldKind,
    required: boolean,
    description: string,
    extra: Partial<Field> = {},
): Field => ({ name, kind, required, description, ...extra })

/**
 * Renders prose with two inline tokens:
 *   `code`            -> inline code chip
 *   [[id]] / [[id|label]] -> clickable link that navigates to collection `id`
 * The link is only interactive when an `onNav` callback is supplied.
 */
export function renderText(text: string, onNav?: (id: string) => void): React.ReactNode {
    const nodes: React.ReactNode[] = []
    const re = /`([^`]+)`|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
    const src = String(text)
    let last = 0, m: RegExpExecArray | null, k = 0
    while ((m = re.exec(src)) !== null) {
        if (m.index > last) nodes.push(<React.Fragment key={k++}>{src.slice(last, m.index)}</React.Fragment>)
        if (m[1] != null) {
            nodes.push(<code key={k++} className="icode">{m[1]}</code>)
        } else {
            const id = m[2]
            const label = m[3] ?? m[2]
            nodes.push(
                <button key={k++} type="button" className="inline-link" onClick={() => onNav?.(id)}>{label}</button>,
            )
        }
        last = re.lastIndex
    }
    if (last < src.length) nodes.push(<React.Fragment key={k++}>{src.slice(last)}</React.Fragment>)
    return nodes
}

export function highlightJson(jsonString: string): React.ReactNode[] {
    const out: React.ReactNode[] = []
    const re = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g
    let last = 0, m: RegExpExecArray | null, k = 0
    while ((m = re.exec(jsonString)) !== null) {
        if (m.index > last) out.push(<span key={k++}>{jsonString.slice(last, m.index)}</span>)
        if (m[1]) {
            const seg = m[1]
            const ci = seg.lastIndexOf('"') + 1
            out.push(<span key={k++} className="tok-key">{seg.slice(0, ci)}</span>)
            out.push(<span key={k++} className="tok-punct">{seg.slice(ci)}</span>)
        } else if (m[2]) out.push(<span key={k++} className="tok-str">{m[2]}</span>)
        else if (m[3]) out.push(<span key={k++} className="tok-bool">{m[3]}</span>)
        else if (m[4]) out.push(<span key={k++} className="tok-null">{m[4]}</span>)
        else if (m[5]) out.push(<span key={k++} className="tok-num">{m[5]}</span>)
        last = re.lastIndex
    }
    if (last < jsonString.length) out.push(<span key={k++}>{jsonString.slice(last)}</span>)
    return out
}

export async function copyText(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text)
            return true
        }
    } catch { /* fall through */ }
    try {
        const ta = document.createElement("textarea")
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"
        document.body.appendChild(ta); ta.focus(); ta.select()
        document.execCommand("copy"); document.body.removeChild(ta)
        return true
    } catch { return false }
}
