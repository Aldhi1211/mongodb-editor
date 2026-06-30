"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import {
    Search, ChevronRight, ChevronDown, Sun, Moon, Check, Menu, X,
    Braces, Link2, KeyRound, ChevronsUpDown, Database, ArrowRight,
} from "lucide-react"
import { STYLES } from "./styles"
import type { SearchItem } from "./types"
import { renderText, copyText } from "./helpers"
import { SchemaTable, CodeBlock, RestartJarPanel, HitEsbPanel, BackupServerPanel, BackupMarioPanel, ReplacerOverviewPanel, OverviewPanel, FlowChart, SectionHeading, SearchResult, PagerButton } from "./components"
import { SECTIONS, CUSTOM_PAGES, COLLECTIONS, ALL_IDS, CHILD_OF, depthOf, ANCHORS, prettyLabel } from "./data"

/** ids that are a parent of at least one child collection — these get a collapse twisty in the sidebar */
const PARENT_IDS = new Set(Object.values(CHILD_OF))
/** direct-children count per parent id (shown when collapsed) */
const CHILD_COUNT: Record<string, number> = {}
for (const child of Object.keys(CHILD_OF)) CHILD_COUNT[CHILD_OF[child]] = (CHILD_COUNT[CHILD_OF[child]] || 0) + 1

export default function MongoDocs({ onClose }: { onClose?: () => void }) {
    const [theme, setTheme] = useState<"light" | "dark">("light")
    const [activeId, setActiveId] = useState("workflows")
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ Workflows: true, Reports: true, Masterdata: true, Replacer: true, ETC: true, FieldsSchema: true })
    const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({ fields: true })
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [copied, setCopied] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [activeSection, setActiveSection] = useState("overview")
    const [versionOpen, setVersionOpen] = useState(false)
    const [version, setVersion] = useState("v1.0")

    const mainRef = useRef<HTMLElement | null>(null)
    const searchRef = useRef<HTMLInputElement | null>(null)
    const searchWrapRef = useRef<HTMLDivElement | null>(null)
    const versionWrapRef = useRef<HTMLDivElement | null>(null)
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
    const ticking = useRef(false)
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const current = COLLECTIONS[activeId]

    /* footer pager — previous / next collection in sidebar order */
    const pageIdx = ALL_IDS.indexOf(activeId)
    const prevId = pageIdx > 0 ? ALL_IDS[pageIdx - 1] : null
    const nextId = pageIdx >= 0 && pageIdx < ALL_IDS.length - 1 ? ALL_IDS[pageIdx + 1] : null

    /* search index (collections + fields with dotted paths) */
    const searchIndex = useMemo<SearchItem[]>(() => {
        const items: SearchItem[] = []
        for (const id of ALL_IDS) {
            const c = COLLECTIONS[id]
            if (!c) continue
            items.push({ type: "collection", id, title: id, sub: c.description, section: c.section })
            const stack: string[] = []
            for (const fld of c.fields) {
                const d = fld.depth || 0
                stack[d] = fld.name; stack.length = d + 1
                const path = stack.join(".")
                items.push({ type: "field", id, title: path, sub: `${id} · ${fld.description}`, kind: fld.kind })
            }
        }
        return items
    }, [])

    const q = query.trim().toLowerCase()
    const results = q
        ? searchIndex.filter((it) => it.title.toLowerCase().includes(q) || (it.sub || "").toLowerCase().includes(q)).slice(0, 28)
        : null

    /* reset on collection change */
    useEffect(() => {
        if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "auto" })
        setActiveSection("overview")
        setDrawerOpen(false)
        // keep the active item visible: expand any collapsed ancestors
        const opens: Record<string, boolean> = {}
        let cur: string | undefined = CHILD_OF[activeId]
        while (cur) { opens[cur] = false; cur = CHILD_OF[cur] }
        if (Object.keys(opens).length) setCollapsedNodes((p) => ({ ...p, ...opens }))
    }, [activeId])

    /* cmd/ctrl + k, escape */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setSearchOpen(true)
                if (searchRef.current) searchRef.current.focus()
            }
            if (e.key === "Escape") {
                // ESC hanya menutup panel search/version; overlay docs hanya bisa ditutup lewat tombol X
                if (searchOpen || versionOpen) {
                    setSearchOpen(false)
                    setVersionOpen(false)
                    if (searchRef.current) searchRef.current.blur()
                }
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [searchOpen, versionOpen])

    /* outside-click for popovers */
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node
            if (searchWrapRef.current && !searchWrapRef.current.contains(target)) setSearchOpen(false)
            if (versionWrapRef.current && !versionWrapRef.current.contains(target)) setVersionOpen(false)
        }
        document.addEventListener("mousedown", onDoc)
        return () => document.removeEventListener("mousedown", onDoc)
    }, [])

    /* scroll spy */
    const handleScroll = () => {
        if (ticking.current) return
        ticking.current = true
        requestAnimationFrame(() => {
            const main = mainRef.current
            if (main) {
                const mt = main.getBoundingClientRect().top
                let cur = ANCHORS[0].id
                for (const a of ANCHORS) {
                    const el = sectionRefs.current[a.id]
                    if (el && el.getBoundingClientRect().top - mt <= 28) cur = a.id
                }
                setActiveSection(cur)
            }
            ticking.current = false
        })
    }

    const scrollToSection = (id: string) => {
        const main = mainRef.current
        const el = sectionRefs.current[id]
        if (!main || !el) return
        const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 12
        main.scrollTo({ top, behavior: "smooth" })
    }

    const handleCopy = async (text: string) => {
        const ok = await copyText(text)
        if (ok) {
            setCopied(true)
            if (copyTimer.current) clearTimeout(copyTimer.current)
            copyTimer.current = setTimeout(() => setCopied(false), 1800)
        }
    }

    const goTo = (id: string, anchor?: string | null) => {
        setActiveId(id)
        setSearchOpen(false)
        setQuery("")
        if (anchor) setTimeout(() => scrollToSection(anchor), 90)
    }

    const toggleSection = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }))
    const toggleCollapse = (id: string) => setCollapsedNodes((p) => ({ ...p, [id]: !p[id] }))
    const isHiddenByCollapse = (id: string) => {
        let cur: string | undefined = CHILD_OF[id]
        while (cur) { if (collapsedNodes[cur]) return true; cur = CHILD_OF[cur] }
        return false
    }

    return (
        <div className={`mongodocs${theme === "dark" ? " dark" : ""}`}>
            <style>{STYLES}</style>

            {/* ---------- top bar ---------- */}
            <header className="topbar">
                <button className="hamburger" onClick={() => setDrawerOpen((v) => !v)} aria-label="Toggle navigation">
                    {drawerOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                <div className="brand">
                    <span className="brand-mark"><Braces size={16} strokeWidth={2.4} /></span>
                    <span className="brand-name">Montra<span>Docs</span></span>
                </div>

                <div className="search-wrap" ref={searchWrapRef}>
                    <Search className="search-icon" size={16} />
                    <input
                        ref={searchRef}
                        className="search-input"
                        placeholder="Search collections and fields…"
                        value={query}
                        onFocus={() => setSearchOpen(true)}
                        onChange={(e) => { setQuery(e.target.value); setSearchOpen(true) }}
                    />
                    {!searchOpen && (
                        <span className="kbd-hint"><span className="kbd">⌘</span><span className="kbd">K</span></span>
                    )}

                    {searchOpen && (
                        <div className="search-panel">
                            {results === null && (
                                <>
                                    {SECTIONS.map((sec) => (
                                        <div key={sec.id}>
                                            <div className="search-grouplabel">{sec.label}</div>
                                            {sec.collections.map((id) => (
                                                <SearchResult
                                                    key={id}
                                                    collection
                                                    title={id}
                                                    sub={COLLECTIONS[id]?.description ?? ""}
                                                    kind="collection"
                                                    onClick={() => goTo(id)}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </>
                            )}

                            {results !== null && results.length > 0 && results.map((it, i) => (
                                <SearchResult
                                    key={i}
                                    collection={it.type === "collection"}
                                    title={it.title}
                                    sub={it.sub}
                                    kind={it.type === "collection" ? "collection" : (it.kind ?? "")}
                                    onClick={() => goTo(it.id, it.type === "field" ? "schema" : null)}
                                />
                            ))}

                            {results !== null && results.length === 0 && (
                                <div className="search-empty">No matches for “{query}”. Try a collection or field name.</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="topbar-right">
                    <div className="version-wrap" ref={versionWrapRef}>
                        <button className="version-btn" onClick={() => setVersionOpen((v) => !v)}>
                            <span className="vlabel">{version}</span><ChevronsUpDown size={14} />
                        </button>
                        {versionOpen && (
                            <div className="version-menu">
                                {[{ v: "v1.0", t: "latest" }, { v: "v0.9", t: "" }, { v: "v0.8", t: "" }].map(({ v, t }) => (
                                    <button key={v} className={`version-item${v === version ? " sel" : ""}`} onClick={() => { setVersion(v); setVersionOpen(false) }}>
                                        <span>{v}</span>{t && <span className="version-tag">{t}</span>}
                                        {v === version && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="icon-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} aria-label="Toggle theme">
                        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                    </button>

                    {onClose && (
                        <button className="icon-btn" onClick={onClose} aria-label="Close documentation">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </header>

            {/* ---------- layout ---------- */}
            <div className="layout">
                {drawerOpen && <div className="overlay" onClick={() => setDrawerOpen(false)} />}

                {/* sidebar */}
                <nav className={`sidebar${drawerOpen ? " open" : ""}`}>
                    {SECTIONS.map((sec) => {
                        const Icon = sec.icon
                        const open = expanded[sec.id]
                        return (
                            <div className="nav-group" key={sec.id}>
                                <button className="nav-group-header" onClick={() => toggleSection(sec.id)}>
                                    <ChevronDown className="chev" size={14} style={{ transform: open ? "none" : "rotate(-90deg)" }} />
                                    <Icon size={15} />
                                    <span className="seclabel">{sec.label}</span>
                                    <span className="nav-count">{sec.collections.length}</span>
                                </button>
                                {open && (
                                    <div className="nav-children">
                                        {sec.collections.map((id) => {
                                            if (isHiddenByCollapse(id)) return null
                                            const hasKids = PARENT_IDS.has(id)
                                            return (
                                                <button
                                                    key={id}
                                                    className={`nav-item${id === activeId ? " active" : ""}${CHILD_OF[id] ? " child" : ""}`}
                                                    style={CHILD_OF[id] ? ({ "--ind": depthOf(id) } as React.CSSProperties) : undefined}
                                                    onClick={() => setActiveId(id)}
                                                >
                                                    {hasKids && (
                                                        <span
                                                            className="nav-twisty"
                                                            role="button"
                                                            tabIndex={-1}
                                                            aria-label={collapsedNodes[id] ? "Expand" : "Collapse"}
                                                            onClick={(e) => { e.stopPropagation(); toggleCollapse(id) }}
                                                        >
                                                            <ChevronRight size={13} style={{ transform: collapsedNodes[id] ? "none" : "rotate(90deg)" }} />
                                                        </span>
                                                    )}
                                                    {prettyLabel(id)}
                                                    {hasKids && collapsedNodes[id] && <span className="nav-subcount">{CHILD_COUNT[id]}</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* main */}
                <main className="main" ref={mainRef} onScroll={handleScroll}>
                    <div className="main-inner">
                        {current ? (
                        <>
                        <div className="crumbs">
                            <span>{current.section}</span>
                            <ChevronRight className="c-sep" size={14} />
                            <span className="c-cur">{prettyLabel(activeId)}</span>
                        </div>

                        <h1 className="page-title">{prettyLabel(activeId)}</h1>
                        <p className="page-desc">{current.description}</p>
                        <div className="chips">
                            <span className="chip"><Database size={13} />{current.meta.documents} documents</span>
                            {current.meta.indexed && <span className="chip"><KeyRound size={13} />indexed</span>}
                            <span className="chip accent">{current.section}</span>
                        </div>

                        <hr className="divider" />

                        {/* overview */}
                        <section className="doc-section" ref={(el) => { sectionRefs.current.overview = el }}>
                            <SectionHeading>Overview</SectionHeading>
                            <OverviewPanel text={current.long} notes={current.notes} onNavigate={goTo} />
                            {current.flow && current.flow.length > 0 && <FlowChart steps={current.flow} onNavigate={goTo} />}
                        </section>

                        {/* schema — disembunyikan untuk collection tanpa fields (kecuali `nodes`) */}
                        {(current.fields.length > 0 || activeId === "nodes") && (
                        <section className="doc-section" ref={(el) => { sectionRefs.current.schema = el }}>
                            <SectionHeading>Schema</SectionHeading>
                            {current.fields.length > 0 ? (
                                <>
                                    <p className="prose">Definisi tiap field pada dokumen <code className="icode">{activeId}</code>. Objek bersarang (nested) dan bentuk elemen array ditampilkan menjorok ke dalam di bawah induknya.</p>
                                    <SchemaTable fields={current.fields} onNavigate={goTo} />
                                </>
                            ) : (
                                <p className="prose">{renderText("Schema untuk setiap Nodes akan dijelaskan secara detail pada [[form|FORM]] dan [[validation|Validation]].", goTo)}</p>
                            )}
                        </section>
                        )}

                        {/* example */}
                        <section className="doc-section" ref={(el) => { sectionRefs.current.example = el }}>
                            <SectionHeading>Example document</SectionHeading>
                            <p className="prose">A representative document as stored in the <code className="icode">{activeId}</code> collection.</p>
                            <CodeBlock fname={`${activeId}.example.json`} data={current.example} copied={copied} onCopy={handleCopy} />
                            {current.example2 && (
                                <>
                                    <hr className="divider" />
                                    <h3 style={{ fontSize: 15, fontWeight: 650, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
                                        {current.example2Label ?? "Contoh lain"}
                                    </h3>
                                    <CodeBlock fname={`${activeId}.example2.json`} data={current.example2} copied={copied} onCopy={handleCopy} />
                                </>
                            )}
                            {current.example3 && (
                                <>
                                    <hr className="divider" />
                                    <h3 style={{ fontSize: 15, fontWeight: 650, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
                                        {current.example3Label ?? "Contoh lain"}
                                    </h3>
                                    <CodeBlock fname={`${activeId}.example3.json`} data={current.example3} copied={copied} onCopy={handleCopy} />
                                </>
                            )}
                            {current.example4 && (
                                <>
                                    <hr className="divider" />
                                    <h3 style={{ fontSize: 15, fontWeight: 650, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
                                        {current.example4Label ?? "Contoh lain"}
                                    </h3>
                                    <CodeBlock fname={`${activeId}.example4.json`} data={current.example4} copied={copied} onCopy={handleCopy} />
                                </>
                            )}
                        </section>

                        {/* indexes & relations */}
                        <section className="doc-section" ref={(el) => { sectionRefs.current.indexes = el }}>
                            <SectionHeading>Indexes &amp; relations</SectionHeading>
                            <div className="kv-grid">
                                {current.indexes.length > 0 && (
                                <div>
                                    <div className="kv-block-label"><KeyRound size={13} /> Indexes</div>
                                    {current.indexes.map((idx, i) => (
                                        <div className="idx-row" key={i}>
                                            <span className="idx-name">{idx.name}</span>
                                            <span className="idx-keys">
                                                {idx.keys.map((k) => <span key={k} className="enum-chip">{k}</span>)}
                                            </span>
                                            {idx.note && <span className="idx-badge plain">{idx.note}</span>}
                                            <span className={`idx-badge ${idx.unique ? "unique" : "plain"}`}>{idx.unique ? "unique" : "non-unique"}</span>
                                        </div>
                                    ))}
                                </div>
                                )}
                                <div>
                                    <div className="kv-block-label"><Link2 size={13} /> Relations</div>
                                    {current.relations.length > 0 ? current.relations.map((rel, i) => (
                                        <div className="rel-row" key={i}>
                                            <span className="rel-field">{rel.field}</span>
                                            <ArrowRight className="rel-arrow" size={15} />
                                            <span className="rel-target" onClick={() => goTo(rel.to)}>{rel.to}</span>
                                            <span className="rel-kind">{rel.kind}</span>
                                        </div>
                                    )) : (
                                        <p className="kv-empty">Belum ada relations di sini.</p>
                                    )}
                                </div>
                            </div>
                        </section>
                        </>
                        ) : CUSTOM_PAGES.has(activeId) ? (
                            activeId === "replacer_overview" ? <ReplacerOverviewPanel />
                                : activeId === "hitesb" ? <HitEsbPanel />
                                : activeId === "backup_server" ? <BackupServerPanel />
                                : activeId === "backup_mario" ? <BackupMarioPanel />
                                : <RestartJarPanel />
                        ) : null}

                        {/* footer pager */}
                        {(prevId || nextId) && (
                            <nav className="pager">
                                {prevId && <PagerButton id={prevId} dir="prev" onClick={() => goTo(prevId)} />}
                                {nextId && <PagerButton id={nextId} dir="next" onClick={() => goTo(nextId)} />}
                            </nav>
                        )}
                    </div>
                </main>

                {/* right rail */}
                {current && (
                    <aside className="rightrail">
                        <div className="rail-sticky">
                            <p className="rail-title">On this page</p>
                            {ANCHORS.filter((a) => a.id !== "schema" || current.fields.length > 0 || activeId === "nodes").map((a) => (
                                <button
                                    key={a.id}
                                    className={`rail-link${activeSection === a.id ? " active" : ""}`}
                                    onClick={() => scrollToSection(a.id)}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    )
}
