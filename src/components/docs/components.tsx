import { useState, useMemo, useEffect, useRef, Fragment, type ReactNode } from "react"
import { ChevronRight, FileJson, Check, Copy, KeyRound, Database, Braces, Link2, ArrowLeft, ArrowRight, Eye, X, BookOpen, ExternalLink } from "lucide-react"
import type { Field, Note, FlowStep } from "./types"
import { renderText, highlightJson, copyText } from "./helpers"
import { ALL_IDS, prettyLabel } from "./data"

/** enum values that map to an actual doc page are rendered as clickable nav buttons */
const PAGE_IDS = new Set(ALL_IDS)
const ENUM_LIMIT = 4

export function TypeCell({ field, onNavigate }: { field: Field; onNavigate?: (id: string) => void }) {
    const [showAll, setShowAll] = useState(false)
    const values = field.enumValues ?? []
    const shown = showAll ? values : values.slice(0, ENUM_LIMIT)
    const hidden = values.length - shown.length
    return (
        <div className="type-cell">
            <span className={`tb tb-${field.kind}`}><span className="dot" />{field.kind}</span>
            {field.of && <span className="type-of">{`<${field.of}>`}</span>}
            {values.length > 0 && (
                <>
                    <span className="enum-label">enum</span>
                    {shown.map((v) => (
                        PAGE_IDS.has(v) && onNavigate
                            ? <button key={v} type="button" className="enum-chip enum-link" onClick={() => onNavigate(v)}>{v}</button>
                            : <span key={v} className="enum-chip">{v}</span>
                    ))}
                    {hidden > 0 && (
                        <button type="button" className="enum-chip enum-more" onClick={() => setShowAll(true)}>+{hidden} lainnya</button>
                    )}
                    {showAll && values.length > ENUM_LIMIT && (
                        <button type="button" className="enum-chip enum-more" onClick={() => setShowAll(false)}>Sembunyikan</button>
                    )}
                </>
            )}
        </div>
    )
}

export function ReqCell({ required }: { required: boolean }) {
    return (
        <span className={`req ${required ? "required" : "optional"}`}>
            <span className="rdot" />{required ? "required" : "optional"}
        </span>
    )
}

/** A single styled callout box (note / tip / warn) with its leading icon. */
export function Callout({ kind, children }: { kind: Note["kind"]; children: ReactNode }) {
    const Icon = kind === "tip" ? Check : kind === "warn" ? KeyRound : ChevronRight
    return (
        <div className={`callout ${kind}`}>
            <span className="ci"><Icon size={16} /></span>
            <div>{children}</div>
        </div>
    )
}

/** A left-to-right process flow: numbered cards joined by arrows. Scrolls horizontally if it overflows. */
export function FlowChart({ steps, onNavigate }: { steps: FlowStep[]; onNavigate?: (id: string) => void }) {
    return (
        <div className="flow-scroll">
            <div className="flow">
                {steps.map((s, i) => (
                    <Fragment key={i}>
                        <div className="flow-step">
                            <span className="flow-num">{i + 1}</span>
                            <div className="flow-body">
                                <div className="flow-title">{renderText(s.title, onNavigate)}</div>
                                {s.detail && <div className="flow-detail">{renderText(s.detail, onNavigate)}</div>}
                            </div>
                        </div>
                        {i < steps.length - 1 && <ArrowRight className="flow-arrow" size={18} aria-hidden="true" />}
                    </Fragment>
                ))}
            </div>
        </div>
    )
}

/** Renders a collection's `notes` array as a stack of callouts. */
export function NoteList({ notes, onNavigate }: { notes: Note[]; onNavigate?: (id: string) => void }) {
    return (
        <>
            {notes.map((n, i) => (
                <Callout key={i} kind={n.kind}>{renderText(n.text, onNavigate)}</Callout>
            ))}
        </>
    )
}

/** Heading for a doc section, with the hover-anchor link icon. */
export function SectionHeading({ children }: { children: ReactNode }) {
    return <h2 className="sec-h">{children} <Link2 className="anchor" size={15} /></h2>
}

/** Overview section body: the collection's `long` narrative as an accented lead card, followed by its notes.
 *  `text` is split into paragraphs on blank lines (\n\n), each rendered as its own <p>. */
export function OverviewPanel({ text, notes, onNavigate }: { text: string; notes: Note[]; onNavigate?: (id: string) => void }) {
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    return (
        <>
            <div className="overview-card">
                <span className="overview-ico"><BookOpen size={15} /></span>
                <div className="overview-lead">
                    {paragraphs.map((p, i) => <p key={i}>{renderText(p, onNavigate)}</p>)}
                </div>
            </div>
            {notes.length > 0 && <NoteList notes={notes} onNavigate={onNavigate} />}
        </>
    )
}

/** A single row in the search panel (collection or field result). */
export function SearchResult({ collection, title, sub, kind, onClick }: {
    collection: boolean; title: string; sub: string; kind: string; onClick: () => void
}) {
    return (
        <div className="result" onClick={onClick}>
            <span className={`result-ico${collection ? " coll" : ""}`}>
                {collection ? <Database size={14} /> : <Braces size={13} />}
            </span>
            <div className="result-body">
                <div className="result-title">{title}</div>
                <div className="result-sub">{sub}</div>
            </div>
            <span className="result-kind">{kind}</span>
        </div>
    )
}

/** Footer prev / next navigation button. */
export function PagerButton({ id, dir, onClick }: { id: string; dir: "prev" | "next"; onClick: () => void }) {
    return (
        <button className={`pager-btn ${dir}`} onClick={onClick}>
            {dir === "prev" && <ArrowLeft className="pager-ico" size={15} />}
            <span className="pager-label">{dir === "prev" ? "Sebelumnya" : "Selanjutnya"}</span>
            <span className="pager-title">{prettyLabel(id)}</span>
            {dir === "next" && <ArrowRight className="pager-ico" size={15} />}
        </button>
    )
}

/** Shell modal dipakai bersama: overlay, header (judul + tombol close), dan ESC-to-close. */
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    // ESC menutup modal ini saja (di-capture agar tidak menutup panel/overlay docs lainnya)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation()
                onClose()
            }
        }
        window.addEventListener("keydown", onKey, true)
        return () => window.removeEventListener("keydown", onKey, true)
    }, [onClose])

    return (
        <div className="eg-modal-overlay" onClick={onClose}>
            <div className="eg-modal" onClick={(e) => e.stopPropagation()}>
                <div className="eg-modal-head">
                    <span className="eg-modal-title">{title}</span>
                    <button className="eg-modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
                </div>
                {children}
            </div>
        </div>
    )
}

/** Modal yang menampilkan contoh sebuah field sebagai JSON ter-format. */
export function ExampleModal({ title, data, onClose }: { title: string; data: unknown; onClose: () => void }) {
    return (
        <ModalShell title={title} onClose={onClose}>
            <pre className="eg-modal-body"><code>{highlightJson(JSON.stringify(data, null, 2))}</code></pre>
        </ModalShell>
    )
}

/** Modal yang menampilkan deskripsi field selengkapnya (untuk deskripsi yang dipotong di tabel). */
export function DescModal({ title, text, onNavigate, onClose }: { title: string; text: string; onNavigate?: (id: string) => void; onClose: () => void }) {
    return (
        <ModalShell title={title} onClose={onClose}>
            <div className="desc-modal-body">{renderText(text, (id) => { onClose(); onNavigate?.(id) })}</div>
        </ModalShell>
    )
}

/** Sel deskripsi yang dipotong (clamp) beberapa baris; bila teks terpotong, munculkan "Selengkapnya". */
function DescCell({ text, onNavigate, onExpand }: { text: string; onNavigate?: (id: string) => void; onExpand: () => void }) {
    const ref = useRef<HTMLDivElement>(null)
    const [clipped, setClipped] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const measure = () => setClipped(el.scrollHeight - el.clientHeight > 2)
        const raf = requestAnimationFrame(measure)
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => { cancelAnimationFrame(raf); ro.disconnect() }
    }, [text])
    return (
        <div className="desc-wrap">
            <div className="desc-cell clamp" ref={ref}>{renderText(text, onNavigate)}</div>
            {clipped && <button type="button" className="desc-more" onClick={onExpand}>Selengkapnya</button>}
        </div>
    )
}

export function SchemaTable({ fields, onNavigate }: { fields: Field[]; onNavigate?: (id: string) => void }) {
    const [egOpen, setEgOpen] = useState<{ name: string; data: unknown } | null>(null)
    const [descOpen, setDescOpen] = useState<{ name: string; text: string } | null>(null)
    const rows: ReactNode[] = []
    let lastGroup: string | undefined
    fields.forEach((field, i) => {
        if (field.group && field.group !== lastGroup) {
            rows.push(
                <tr key={`g${i}`} className="schema-group-row">
                    <td colSpan={5}><span className="schema-group">{field.group}</span></td>
                </tr>,
            )
        }
        lastGroup = field.group
        const depth = field.depth || 0
        rows.push(
            <tr key={i}>
                <td>
                    <div className="field-cell" style={{ paddingLeft: depth ? depth * 18 : 0 }}>
                        {depth > 0 && <span className="tree-guide" aria-hidden="true" />}
                        <span className={`field-name${depth ? " nested" : ""}`}>{field.name}</span>
                    </div>
                </td>
                <td><TypeCell field={field} onNavigate={onNavigate} /></td>
                <td><ReqCell required={field.required} /></td>
                <td><DescCell text={field.description} onNavigate={onNavigate} onExpand={() => setDescOpen({ name: field.name, text: field.description })} /></td>
                <td>
                    <button className="eg-btn" title="Lihat contoh" onClick={() => setEgOpen({ name: field.name, data: field.eg !== undefined ? field.eg : { [field.name]: "..." } })}>
                        <Eye size={15} />
                    </button>
                </td>
            </tr>,
        )
    })
    return (
        <>
            <div className="table-scroll">
                <div className="table-x">
                    <table className="schema-table">
                        <colgroup>
                            <col style={{ width: "24%" }} />
                            <col style={{ width: "22%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "36%" }} />
                            <col style={{ width: "6%" }} />
                        </colgroup>
                        <thead>
                            <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th title="Contoh"><Eye size={13} /></th></tr>
                        </thead>
                        <tbody>{rows}</tbody>
                    </table>
                </div>
            </div>
            {egOpen && <ExampleModal title={egOpen.name} data={egOpen.data} onClose={() => setEgOpen(null)} />}
            {descOpen && <DescModal title={descOpen.name} text={descOpen.text} onNavigate={onNavigate} onClose={() => setDescOpen(null)} />}
        </>
    )
}

export function CodeBlock({ fname, data, copied, onCopy }: {
    fname: string
    data: unknown
    copied: boolean
    onCopy: (text: string) => void
}) {
    const json = useMemo(() => JSON.stringify(data, null, 2), [data])
    return (
        <div className="code-block">
            <div className="code-head">
                <span className="code-fname">
                    <span className="dots"><i style={{ background: "#ff5f57" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#28c840" }} /></span>
                    <FileJson size={14} /> {fname}
                </span>
                <button className={`copy-btn${copied ? " copied" : ""}`} onClick={() => onCopy(json)}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <div className="code-body">
                <pre><code>{highlightJson(json)}</code></pre>
            </div>
        </div>
    )
}

/** Gambar dokumentasi: bordered, dengan caption opsional, klik untuk zoom (lightbox).
 *  `src` menunjuk ke file di /public, mis. "/docs/restart-jar-1.png". */
export function DocImage({ src, alt, caption, width }: { src: string; alt: string; caption?: string; width?: number }) {
    const [zoom, setZoom] = useState(false)
    return (
        <figure className="doc-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} style={width ? { maxWidth: width } : undefined} onClick={() => setZoom(true)} />
            {caption && <figcaption>{caption}</figcaption>}
            {zoom && (
                <div className="doc-img-zoom" onClick={() => setZoom(false)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={alt} />
                    <button className="doc-img-close" aria-label="Close"><X size={18} /></button>
                </div>
            )}
        </figure>
    )
}

/** Blok perintah shell (terminal) dengan tombol copy. Render literal (tanpa highlight JSON). */
export function CommandBlock({ command }: { command: string }) {
    const [copied, setCopied] = useState(false)
    const copy = async () => {
        if (await copyText(command)) {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        }
    }
    return (
        <div className="cmd-block">
            <pre><code>{command}</code></pre>
            <button className={`cmd-copy${copied ? " copied" : ""}`} onClick={copy} aria-label="Copy">
                {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
        </div>
    )
}

/** Link ke sumber eksternal (mis. dokumentasi Postman), terbuka di tab baru. */
export function DocLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a className="doc-link" href={href} target="_blank" rel="noopener noreferrer">
            {children}<ExternalLink size={13} />
        </a>
    )
}

/** Daftar key–value ringkas (label: nilai). Nilai mendukung `code`/[[link]] lewat renderText. */
export function KvList({ items, onNavigate }: { items: { k: string; v: string }[]; onNavigate?: (id: string) => void }) {
    return (
        <ul className="kv-list">
            {items.map((it, i) => (
                <li key={i}><strong>{it.k}:</strong> {renderText(it.v, onNavigate)}</li>
            ))}
        </ul>
    )
}

/** Custom (non-collection) page: dokumentasi cara Restart Jar. */
export function RestartJarPanel() {
    return (
        <>
            <div className="crumbs">
                <span>ETC</span>
                <ChevronRight className="c-sep" size={14} />
                <span className="c-cur">Restart Jar</span>
            </div>
            <h1 className="page-title">Restart Jar</h1>
            <p className="page-desc">Restart service .jar di server agar perubahan pada routing maupun assignment terbaca oleh project Spring Boot.</p>
            <hr className="divider" />

            <section className="doc-section">
                <h2 className="sec-h">Apa itu Restart Jar?</h2>
                <p className="prose">{renderText("Backend BYON berjalan sebagai aplikasi Spring Boot berbentuk file `.jar` di server. Sebagian konfigurasi workflow — terutama `routing` (tujuan node berikutnya) dan `assignment` (penugasan task) — dibaca dan di-cache saat aplikasi start, bukan dibaca ulang setiap ada perubahan.")}</p>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">Kapan perlu Restart Jar?</h2>
                <Callout kind="warn">{renderText("Setiap kali mengubah `routing` atau `assignment` langsung di database, perubahan tidak akan terbaca oleh aplikasi yang sedang berjalan sampai service `.jar` di-restart.")}</Callout>
                <p className="prose">{renderText("Contoh perubahan yang memerlukan Restart Jar: mengubah tujuan node pada Validation/Form, mengubah penugasan (`assignment`) task, atau menambah/mengubah node pada workflow.")}</p>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">Cara Restart Jar (via script)</h2>
                <p className="prose">Langkah berikut dijalankan di server (lewat SSH), pada folder project Anda. Metode ini memakai script restart bawaan project.</p>
                <ol className="doc-steps">
                    <li>
                        <p className="prose"><strong>Cek jar yang sedang berjalan.</strong> Jalankan <code className="icode">ps -ef | grep jar</code> untuk melihat service <code className="icode">.jar</code> yang aktif beserta PID-nya. Catat PID jar project Anda (mis. <code className="icode">byonchat-v3aho.jar</code>).</p>
                        <DocImage src="/docs/restart_jar_checkjar.png" alt="Cek jar yang berjalan dengan ps -ef | grep jar" caption="Daftar service .jar yang aktif beserta PID-nya." />
                    </li>
                    <li>
                        <p className="prose"><strong>Cek nama script restart.</strong> Masuk ke folder project lalu jalankan <code className="icode">ls</code>. Cari file script berekstensi <code className="icode">.sh</code> — pada contoh ini bernama <code className="icode">aho.sh</code>.</p>
                        <DocImage src="/docs/restart_jar_restartviascript_1_checkscriptname.png" alt="Cek nama script restart dengan ls" caption="Script restart project, mis. aho.sh." />
                    </li>
                    <li>
                        <p className="prose"><strong>Jalankan script restart.</strong> Jalankan <code className="icode">sudo ./aho.sh restart</code> (masukkan password sudo bila diminta). Script akan menghentikan jar lama lalu menjalankannya kembali — perhatikan pesan <code className="icode">stopped</code> lalu <code className="icode">started with PID …</code>.</p>
                        <DocImage src="/docs/restart_jar_restartviascript_2_runscript.png" alt="Menjalankan sudo ./aho.sh restart" caption="Jar lama dihentikan, lalu dijalankan kembali dengan PID baru." />
                    </li>
                    <li>
                        <p className="prose"><strong>Verifikasi setelah restart.</strong> Jalankan lagi <code className="icode">ps -ef | grep jar</code>. Pastikan jar project berjalan dengan <strong>PID baru</strong> (berbeda dari sebelumnya) — menandakan restart berhasil.</p>
                        <DocImage src="/docs/restart_jar_restartviascript_3_checkjarafter.png" alt="Verifikasi jar berjalan dengan PID baru" caption="Jar aktif kembali dengan PID baru setelah restart." />
                    </li>
                </ol>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">Cara Restart Jar (manual)</h2>
                <p className="prose">Alternatif tanpa script: hentikan proses jar lewat PID-nya, lalu jalankan kembali secara manual. Pakai cara ini bila project tidak punya script restart.</p>
                <ol className="doc-steps">
                    <li>
                        <p className="prose"><strong>Cek PID jar.</strong> Jalankan <code className="icode">ps -ef | grep jar</code> untuk menemukan PID jar yang ingin di-restart (mis. <code className="icode">byonchat-v3aming.jar</code> dengan PID <code className="icode">2466598</code>).</p>
                        <DocImage src="/docs/restart_jar_checkjar.png" alt="Cek PID jar dengan ps -ef | grep jar" caption="Catat PID jar yang akan di-restart (kolom kedua)." />
                    </li>
                    <li>
                        <p className="prose"><strong>Hentikan (kill) jar.</strong> Jalankan <code className="icode">sudo kill -9 2466598</code> — ganti <code className="icode">2466598</code> dengan PID dari langkah 1.</p>
                        <DocImage src="/docs/restart_jar_manual_1_killjar.png" alt="Menghentikan jar dengan sudo kill -9 PID" caption="Hentikan proses jar berdasarkan PID-nya." />
                    </li>
                    <li>
                        <p className="prose"><strong>Pastikan jar sudah mati.</strong> Jalankan lagi <code className="icode">ps -ef | grep jar</code> dan pastikan PID jar tadi sudah tidak muncul lagi di daftar.</p>
                        <DocImage src="/docs/restart_jar_manual_2_pastiinjarmatii.png" alt="Memastikan jar sudah mati" caption="PID jar yang di-kill sudah hilang dari daftar." />
                    </li>
                    <li>
                        <p className="prose"><strong>Jalankan kembali.</strong> Start ulang jar secara manual: <code className="icode">{'sudo nohup java -jar byonchat-v3aming.jar -Dspring.config.additional-location="config/" > /dev/null 2>&1&'}</code></p>
                        <DocImage src="/docs/restart_jar_manual_3_jalaninkembali.png" alt="Menjalankan kembali jar secara manual" caption="Jar dijalankan kembali dengan nohup di background." />
                    </li>
                    <li>
                        <p className="prose"><strong>Pastikan jar jalan.</strong> Jalankan <code className="icode">ps -ef | grep jar</code> sekali lagi. Pastikan jar berjalan kembali dengan <strong>PID baru</strong>.</p>
                        <DocImage src="/docs/restart_jar_manual_4_pastiinjalan.png" alt="Memastikan jar berjalan kembali" caption="Jar aktif kembali dengan PID baru." />
                    </li>
                </ol>
            </section>
        </>
    )
}

/** Custom (non-collection) page: dokumentasi cara Hit ESB (push report Penjualan Harian ke ESB). */
export function HitEsbPanel() {
    return (
        <>
            <div className="crumbs">
                <span>ETC</span>
                <ChevronRight className="c-sep" size={14} />
                <span className="c-cur">Hit ESB</span>
            </div>
            <h1 className="page-title">Hit ESB</h1>
            <p className="page-desc">Mendorong (push) data report Penjualan Harian ke integrasi ESB lewat API bypass, serta cara menangani error &quot;Menu not found&quot; dengan mapping menu code ke ESB menu id.</p>
            <hr className="divider" />

            <section className="doc-section">
                <h2 className="sec-h">Apa itu Hit ESB?</h2>
                <p className="prose">{renderText("Hit ESB adalah proses mengirim data penjualan (report Penjualan Harian) ke integrasi ESB (Enterprise Service Bus) — backend F&B eksternal di `stg7.esb.co.id`. API `bypass` dipakai untuk mengirim ulang satu konten report berdasarkan `_id`-nya. Halaman ini juga mencakup penanganan error umum `Menu not found`, yaitu ketika sebuah menu belum ter-mapping ke ESB menu id.")}</p>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">Kapan dipakai?</h2>
                <Callout kind="note">{renderText("Saat data penjualan sebuah outlet pada tanggal tertentu belum/gagal terkirim ke ESB sehingga perlu dikirim ulang secara manual; atau saat push gagal karena ada menu yang belum ter-mapping.")}</Callout>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">Langkah-langkah</h2>
                <Callout kind="tip">Koleksi Postman untuk semua API ESB (bypass, get-menu, reload) ada di <DocLink href="https://documenter.getpostman.com/view/11535913/2sBXitBnEG">dokumentasi Postman ESB</DocLink>.</Callout>
                <ol className="doc-steps">
                    <li>
                        <p className="prose"><strong>Terima daftar transaksi.</strong> Dapatkan info transaksi yang perlu dikirim: tanggal dan daftar outlet (mis. dari pesan yang diteruskan).</p>
                        <DocImage src="/docs/hitesb_1_contohlistoutlet.jpeg" alt="Contoh daftar outlet & tanggal transaksi" caption="Contoh: tanggal transaksi beserta daftar outlet yang perlu di-push." />
                    </li>
                    <li>
                        <p className="prose"><strong>Cek data warehouse.</strong> Buka <code className="icode">System → Master Data → Warehouse</code>, cari outlet untuk mendapatkan Warehouse Code (mis. PIM → <code className="icode">022_PIM</code>).</p>
                        <DocImage src="/docs/hitesb_2_checkdatawarehouse.jpeg" alt="Cek warehouse code di Master Data Warehouse" caption="Warehouse Code outlet, mis. 022_PIM." />
                    </li>
                    <li>
                        <p className="prose"><strong>Query report Penjualan Harian.</strong> Di MongoDB, query collection <code className="icode">report_reportPenjualanHarian</code> dengan filter tanggal &amp; warehouse:</p>
                        <p className="prose"><code className="icode">{`db.getCollection('report_reportPenjualanHarian').find({"data.tanggal": "2026-06-23", "data.wh_name": "042_MGR"})`}</code></p>
                        <DocImage src="/docs/hitesb_3_reportPenjualanHarian_query.jpeg" alt="Query report Penjualan Harian di MongoDB" caption="Query berdasarkan data.tanggal dan data.wh_name." />
                    </li>
                    <li>
                        <p className="prose"><strong>Ambil ID-nya.</strong> Dari dokumen hasil query, ambil <code className="icode">_id</code> (ObjectId).</p>
                        <DocImage src="/docs/hitesb_4_ambilidnya.jpeg" alt="Ambil _id dokumen report" caption="Salin _id (ObjectId) dokumen report." />
                    </li>
                    <li>
                        <p className="prose"><strong>Hit API ESB bypass.</strong> Di Postman, <code className="icode">POST http://dmdev.byonchat2.com:37003/penjualan/bypass/esb/id</code> dengan body raw JSON berisi array <code className="icode">_id</code> report:</p>
                        <p className="prose"><code className="icode">{`["6a3b8f60fc4ff02486f03c5e"]`}</code></p>
                        <p className="prose">Respon <code className="icode">ok!</code> (200) berarti permintaan diterima.</p>
                        <DocImage src="/docs/hitesb_5_postmelaluipostman.jpeg" alt="POST ke API ESB bypass via Postman" caption="POST .../penjualan/bypass/esb/id dengan body array _id → respon ok!." />
                    </li>
                    <li>
                        <p className="prose"><strong>Pantau log — berhasil.</strong> Sambil menunggu, pantau log server. Jika sukses: muncul <code className="icode">Sending Sales Transaction</code>, <code className="icode">push successful</code>, dan <code className="icode">status=SUCCESS</code>.</p>
                        <DocImage src="/docs/hitesb_6_sambilchecklog_logaman.jpeg" alt="Log push berhasil" caption="Log aman: target=esb → SUCCESS." />
                    </li>
                    <li>
                        <p className="prose"><strong>Pantau log — error Menu not found.</strong> Jika gagal, log menampilkan <code className="icode">400 Bad Request … Menu not found: saleshead.menu[…]</code> dan <code className="icode">status=ERROR</code>. Lanjut ke langkah perbaikan mapping di bawah.</p>
                        <DocImage src="/docs/hitesb_7_sambilchecklog_logerror_menunotfound.jpeg" alt="Log error menu not found" caption="Error: Menu not found → status=ERROR." />
                    </li>
                    <li>
                        <p className="prose"><strong>Copy payload dari log.</strong> Dari log error, salin payload (raw) transaksi yang gagal.</p>
                        <DocImage src="/docs/hitesb_8_sambilchecklog_logerror_copypayloadnya.jpeg" alt="Copy payload dari log error" caption="Salin payload (raw) transaksi yang gagal." />
                    </li>
                    <li>
                        <p className="prose"><strong>Tempel ke VSCode.</strong> Paste payload ke VSCode agar mudah dibaca. Cari menu bermasalah — yang <code className="icode">menuID</code>-nya <code className="icode">0</code> (belum ter-mapping). Catat <code className="icode">menuCode</code>-nya (mis. <code className="icode">O-ASY0030</code>).</p>
                        <DocImage src="/docs/hitesb_9_sambilchecklog_logerror_copykevscode.jpeg" alt="Baca payload di VSCode, cari menuID 0" caption="menuID: 0 → menu belum ter-mapping. Catat menuCode-nya." />
                    </li>
                    <li>
                        <p className="prose"><strong>Hit API Get Menu.</strong> Ambil ESB menu id asli: <code className="icode">POST https://stg7.esb.co.id/api-fnb-backend/web/corev1/master/get-menu?menuCode=O-ASY0030</code>. Respon memuat <code className="icode">menuID</code> asli (mis. <code className="icode">499</code>).</p>
                        <DocImage src="/docs/hitesb_10_hitapigetmenu.jpeg" alt="Hit API get-menu untuk dapat ESB menuID" caption="get-menu?menuCode=O-ASY0030 → menuID: 499." />
                    </li>
                    <li>
                        <p className="prose"><strong>Tambahkan di Masterdata ESB Mapper.</strong> Tambah record baru di <code className="icode">Masterdata → ESB Mapper</code>: <code className="icode">Menu Code</code> = <code className="icode">O-ASY0030</code>, <code className="icode">ESB Menu Id</code> = <code className="icode">499</code>. Lalu Submit.</p>
                        <DocImage src="/docs/hitesb_11_tambahkandimasterdataesbmapper.jpeg" alt="Tambah mapping di Masterdata ESB Mapper" caption="New Record: Menu Code O-ASY0030 → ESB Menu Id 499." />
                    </li>
                    <li>
                        <p className="prose"><strong>Reload mapper.</strong> Segarkan mapping: <code className="icode">POST http://dmdev.byonchat2.com:37003/penjualan/bypass/reload</code>. Respon <code className="icode">ok!</code>.</p>
                        <DocImage src="/docs/hitesb_12_reload.jpeg" alt="Reload ESB mapper" caption="POST .../penjualan/bypass/reload → ok!." />
                    </li>
                    <li>
                        <p className="prose"><strong>Hit kembali API ESB bypass.</strong> Ulangi langkah 5 — <code className="icode">POST http://dmdev.byonchat2.com:37003/penjualan/bypass/esb/id</code> dengan <code className="icode">_id</code> yang sama. Karena menu sudah ter-mapping, push kini berhasil (cek log → <code className="icode">status=SUCCESS</code>).</p>
                    </li>
                </ol>
            </section>
        </>
    )
}

/** Custom (non-collection) page: dokumentasi cara backup file storage ke server baru. */
export function BackupServerPanel() {
    return (
        <>
            <div className="crumbs">
                <span>ETC</span>
                <ChevronRight className="c-sep" size={14} />
                <span className="c-cur">Backup Server</span>
            </div>
            <h1 className="page-title">Backup Server</h1>
            <p className="page-desc">Cara mem-backup file storage client ke server baru memakai rsync — termasuk cek ukuran storage dan (opsional) menghapus file lama.</p>
            <hr className="divider" />

            <section className="doc-section">
                <h2 className="sec-h">Catatan filter tanggal</h2>
                <Callout kind="note">{renderText("Perintah memakai `find … -newermt <tanggal>` untuk memfilter berdasarkan waktu modifikasi file. `! -newermt 2026-01-01` berarti file yang TIDAK lebih baru dari 1 Jan 2026 (yakni dibuat/diubah sebelum tanggal itu). Kombinasi `-newermt A ! -newermt B` = file pada rentang antara tanggal A dan B.")}</Callout>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">Langkah-langkah</h2>
                <ol className="doc-steps">
                    <li>
                        <p className="prose"><strong>Masuk ke direktori storage client.</strong> Ganti <code className="icode">namaclientnya</code> dengan nama client yang dimaksud.</p>
                        <CommandBlock command={`cd /var/www/html/storages/namaclientnya/images`} />
                    </li>
                    <li>
                        <p className="prose"><strong>Cek ukuran storage.</strong> Menghitung total ukuran file yang akan di-backup (mis. file lebih lama dari 1 Jan 2026).</p>
                        <CommandBlock command={`find . -type f ! -newermt 2026-01-01 -print0 | du -ch --files0-from=- | tail -n 1`} />
                    </li>
                    <li>
                        <p className="prose"><strong>Rsync ke server baru.</strong> Mengirim file (lebih lama dari 1 Des 2025) ke server tujuan lewat SSH port 1771. <code className="icode">-aP</code> = mode archive + tampilkan progress.</p>
                        <CommandBlock command={`find . -type f ! -newermt 2025-12-01 -printf '%P\\n' | rsync -aP -e "ssh -p 1771" --files-from=- . lutfi@103.39.68.133:/home/lutfi/backup_aditama_cm_at_november2025/`} />
                    </li>
                    <li>
                        <p className="prose"><strong>(Opsional) Hapus file lama.</strong> Setelah backup terverifikasi, hapus file pada rentang tanggal tertentu di server asal.</p>
                        <Callout kind="warn">{renderText("`rm -fv` menghapus permanen. Pastikan backup sudah benar-benar terkirim dan terverifikasi sebelum menjalankan ini. Sesuaikan path direktori dan rentang tanggalnya.")}</Callout>
                        <CommandBlock command={`find /lokasi/direktori -type f -newermt 2022-08-01 ! -newermt 2022-09-01 -exec rm -fv {} \\;`} />
                    </li>
                </ol>
            </section>
        </>
    )
}

/** Custom (non-collection) page: runbook Daily Checking SMS & Power BI (backup pekerjaan Mario). */
export function BackupMarioPanel() {
    return (
        <>
            <div className="crumbs">
                <span>ETC</span>
                <ChevronRight className="c-sep" size={14} />
                <span className="c-cur">Backup Kerjaan Mario</span>
            </div>
            <h1 className="page-title">Backup Kerjaan Mario</h1>
            <p className="page-desc">Ringkasan cara melakukan Daily Checking SMS &amp; Power BI — panduan untuk meng-cover pekerjaan rutin harian.</p>
            <hr className="divider" />

            <Callout kind="tip"><strong>Template Report</strong> — <DocLink href="https://docs.google.com/spreadsheets/d/1KmelM3jNgueBfbtoH39VNd6s6Na96kRhq2N9_E23Tts/edit#gid=1425538003">buka spreadsheet</DocLink>. Spreadsheet ini dipakai untuk mendata pekerjaan yang sudah dilakukan. Setiap selesai mengerjakan satu checking, isi di spreadsheet, screenshot, lalu kirim ke grup.</Callout>

            <section className="doc-section">
                <h2 className="sec-h">1. Check HP Lantai 3</h2>
                <p className="prose">Cek HP di Lantai 3 (rack sebelah Setia &amp; Ruang Server).</p>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">2. Testing SMS ACT</h2>
                <KvList items={[
                    { k: "Waktu test", v: "Pagi, Siang, Sore" },
                    { k: "No Tujuan", v: "`6287777768000`" },
                    { k: "Isi Pesan", v: "`ACT`" },
                    { k: "Sender", v: "TSEL / ISAT / XL" },
                    { k: "Feedback", v: "balasan dari senderID Standchart" },
                ]} />
                <Callout kind="tip"><strong>Report ke grup (bareng ACT &amp; HSBC):</strong> &quot;Hallo Team, berikut untuk Update Test ACT &amp; HSBC Pagi ini&quot;</Callout>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">3. Testing SMS HSBC</h2>
                <p className="prose">Referensi: <DocLink href="https://docs.google.com/document/d/1xKM-F5mCyEdcnXv6zd4I1BnQi8BFLFfN/edit?usp=drive_link&ouid=105337894770672557558&rtpof=true&sd=true">Manual Book</DocLink></p>
                <KvList items={[
                    { k: "Waktu test", v: "Pagi, Siang, Sore" },
                    { k: "No Tujuan", v: "`84722`" },
                    { k: "Isi Pesan", v: "`POIN 580632` (6 angka random)" },
                    { k: "Sender", v: "TSEL" },
                    { k: "Feedback", v: "balasan dari SenderID HSBC" },
                ]} />
                <Callout kind="tip"><strong>Report ke grup (bareng ACT &amp; HSBC):</strong> &quot;Hallo Team, berikut untuk Update Test ACT &amp; HSBC Pagi ini&quot;</Callout>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">4. Testing SMS HSBC (POIN)</h2>
                <KvList items={[
                    { k: "Waktu test", v: "09:00, 11:00, 14:00, 17:00" },
                    { k: "No Tujuan", v: "`08818884722`" },
                    { k: "Isi Pesan", v: "`POIN`" },
                    { k: "Sender", v: "ISAT" },
                    { k: "Feedback", v: "balasan dari SenderID HSBC" },
                ]} />
                <Callout kind="tip"><strong>Report ke grup (sertakan foto feedback):</strong> &quot;Halo Team, berikut update test POIN HSBC siang ini aman&quot;</Callout>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">5. Test SMS Indosat Premium &amp; Reguler</h2>
                <p className="prose">Form Tester: <DocLink href="https://203.166.197.162/TesterSenderID/index.php">TesterSenderID</DocLink> &nbsp;·&nbsp; Waktu test: setiap jam.</p>
                <p className="prose"><strong>Cara check:</strong></p>
                <KvList items={[
                    { k: "Type", v: "\"Indosat Premium\" atau \"Indosat Reguler\"" },
                    { k: "SenderID", v: "`HSBC` / `StanChart` / `CITIBANK`" },
                    { k: "Phone Number", v: "`6285776305898` (nomor Indosat)" },
                    { k: "Message", v: "`TEST SMS`" },
                ]} />
                <Callout kind="tip"><strong>Report:</strong> &quot;Hallo Team, berikut update HSBC, CITIBANK, StanChart&quot; — sore: &quot;…HSBC, CITIBANK, StanChart, Vonage Sore ini&quot;</Callout>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">6. Test SMS Telkomsel Premium &amp; Reguler Mustika</h2>
                <p className="prose">Form Tester: <DocLink href="https://203.166.197.162/TesterSenderID/index.php">TesterSenderID</DocLink> &nbsp;·&nbsp; Waktu test: setiap jam.</p>
                <p className="prose"><strong>Cara check:</strong></p>
                <KvList items={[
                    { k: "Type", v: "\"Telkomsel Premium Mustika\" atau \"Telkomsel Reguler Mustika\"" },
                    { k: "SenderID", v: "`HSBC`" },
                    { k: "Phone Number", v: "`6282138863082` (nomor Telkomsel)" },
                    { k: "Message", v: "`TEST SMS`" },
                ]} />
                <p className="prose"><strong>Test SMS Vonage</strong> — Waktu test: Pagi, Siang, Sore.</p>
                <KvList items={[
                    { k: "Type", v: "\"Vonage\"" },
                    { k: "SenderID", v: "`DANACITA`" },
                    { k: "Phone Number", v: "nomor tujuan TSEL / ISAT / XL" },
                    { k: "Message", v: "`TEST SMS`" },
                ]} />
            </section>

            <section className="doc-section">
                <h2 className="sec-h">7. Testing HP SINCH &amp; TELESIGN</h2>
                <p className="prose">Waktu test: Pagi, Siang, Sore. Isi pesan menyesuaikan waktu: <code className="icode">Selamat Pagi</code> / <code className="icode">Selamat Siang</code> / <code className="icode">Selamat Sore</code>.</p>
                <p className="prose"><strong>Kirim SMS pakai Indosat ke:</strong></p>
                <KvList items={[
                    { k: "6288971782932", v: "perlu konfirmasi ke Team B3" },
                ]} />
                <p className="prose"><strong>Kirim SMS pakai TSEL ke:</strong></p>
                <KvList items={[
                    { k: "6285212358161", v: "perlu konfirmasi ke Team B3" },
                    { k: "6281385907495", v: "perlu konfirmasi ke Team B3" },
                    { k: "6285719039207", v: "perlu melihat Device Lt 3 F2/12" },
                    { k: "6287788245316", v: "perlu melihat Device Lt 3 F2/12" },
                ]} />
                <Callout kind="warn">Setiap mengirim pesan, lihat device-nya dan pastikan muncul notifikasi <code className="icode">SMS RECEIVED</code> sebagai tanda SMS berhasil diterima.</Callout>
                <Callout kind="tip"><strong>Report:</strong> &quot;Hallo Team, berikut Update Check SINCH dan TELESIGN aman&quot;</Callout>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">8. Check SMS LBA</h2>
                <Callout kind="warn">Sudah tidak perlu dilakukan lagi (arsip).</Callout>
                <p className="prose">Referensi: <DocLink href="http://202.78.202.92/login.php">CMS LBA</DocLink> &nbsp;·&nbsp; <DocLink href="https://docs.google.com/document/d/1yjp5YMDN01HY9aiMoqdguZnuaRFBFcZW/edit?usp=sharing&ouid=105337894770672557558&rtpof=true&sd=true">Manual Book</DocLink></p>
                <KvList items={[
                    { k: "Waktu check", v: "09:00, 11:00, 13:00, 15:00, 17:00" },
                ]} />
            </section>

            <section className="doc-section">
                <h2 className="sec-h">9. Check PC Power BI</h2>
                <p className="prose"><strong>Pastikan kondisi PC:</strong></p>
                <KvList items={[
                    { k: "PC", v: "dalam keadaan hidup" },
                    { k: "Internet", v: "PC terhubung ke internet" },
                    { k: "On-Premises Gateway", v: "dalam keadaan login & terbuka" },
                ]} />
            </section>

            <section className="doc-section">
                <h2 className="sec-h">10. Check PEDRO</h2>
                <Callout kind="warn">Sudah tidak perlu dilakukan lagi (arsip).</Callout>
                <p className="prose"><strong>Pedro</strong> — buka <DocLink href="https://github.com/pedroslopez/whatsapp-web.js">whatsapp-web.js</DocLink>, klik versi latest, capture, kirim ke grup <code className="icode">Internal Tech Support SMS</code>. Info WA: &quot;Halo team, untuk update web saat ini masih versi 1.21.0&quot;.</p>
                <p className="prose"><strong>WA Web</strong> — buka WA Web → Setting → Bantuan → capture versi → kirim ke grup. Info WA: &quot;Untuk web saat ini 2.2322.15&quot;. Dilakukan Pagi / Siang / Sore.</p>
            </section>
        </>
    )
}

/** Custom (non-collection) page: overview of the replacer / expression syntax. */
export function ReplacerOverviewPanel() {
    return (
        <>
            <div className="crumbs">
                <span>Replacer</span>
                <ChevronRight className="c-sep" size={14} />
                <span className="c-cur">overview</span>
            </div>
            <h1 className="page-title">Replacer</h1>
            <p className="page-desc">Replacer adalah sintaks ekspresi yang ditulis dengan pola <code className="icode">{"${...}"}</code>, dipakai untuk mengisi sebuah nilai secara dinamis berdasarkan data lain — bukan nilai statis yang ditulis langsung.</p>
            <hr className="divider" />

            <section className="doc-section">
                <h2 className="sec-h">Apa itu Replacer?</h2>
                <p className="prose">{renderText("Alih-alih menulis nilai tetap, sebuah field dapat diisi dengan replacer agar nilainya diambil/diolah saat runtime. Penulisannya dibungkus `${...}`. Isinya bisa berupa path menuju data (misalnya field pada form lain) maupun pemanggilan fungsi seperti `IFNULL` atau `SPLIT`.")}</p>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">Contoh penggunaan</h2>
                <Callout kind="note">{renderText("`${$.$.formData.type}` — mengambil nilai field `type` dari data form saat ini.")}</Callout>
                <Callout kind="note">{renderText("`${workflowMaintenance.form4.formData.cm1}` — mengambil nilai field `cm1` dari form lain (`form4`) pada workflow `workflowMaintenance`.")}</Callout>
                <Callout kind="note">{renderText("`${IFNULL|a|b}` — memakai nilai `a`; jika `a` bernilai null, memakai `b` sebagai gantinya.")}</Callout>
                <Callout kind="note">{renderText("`${SPLIT|teks|pemisah|index}` — memecah `teks` berdasarkan `pemisah`, lalu mengambil potongan ke-`index`.")}</Callout>
            </section>

            <section className="doc-section">
                <h2 className="sec-h">Catatan</h2>
                <p className="prose">Daftar lengkap fungsi replacer beserta sintaksnya akan dilengkapi kemudian.</p>
            </section>
        </>
    )
}
