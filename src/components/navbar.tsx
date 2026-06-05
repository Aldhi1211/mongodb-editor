"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { BarChart2, FileText, History, LogOut, MenuIcon, Table2 } from "lucide-react"

import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export type NavBarTab = "data" | "audit"

interface NavBarMenuProps {
    /** Current home view. Only provided on the home page, where Editor/Audit are a view toggle. */
    view?: NavBarTab
    /** Toggle handler for the home view. When omitted (other pages), Editor/Audit navigate home. */
    onViewChange?: (view: NavBarTab) => void
}

/** Montra brand mark — same glyph used on the auth pages. */
function BrandMark() {
    return (
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
            <rect x="1" y="1" width="30" height="30" rx="8" fill="#0A0A0A" />
            <path
                d="M16 12.9V16M16 16L11 19.5M16 16L21 19.5"
                stroke="#FFFFFF"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="16" cy="10.6" r="2.05" fill="#FFFFFF" />
            <circle cx="10.6" cy="21.4" r="2.05" fill="#FFFFFF" />
            <circle cx="21.4" cy="21.4" r="2.05" fill="#FFFFFF" />
        </svg>
    )
}

const ITEM_BASE =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors"
const ITEM_ACTIVE = "bg-neutral-900 text-white"
const ITEM_IDLE = "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"

function DraftBadge({ count }: { count: number }) {
    if (count <= 0) return null
    return (
        <span className="ml-0.5 text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-px leading-none">
            {count}
        </span>
    )
}

export function NavBarMenu({ view, onViewChange }: NavBarMenuProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [userEmail, setUserEmail] = useState("")
    const [draftCount, setDraftCount] = useState(0)

    // Derive the signed-in user's email from the JWT.
    useEffect(() => {
        const t = localStorage.getItem("token")
        if (!t) return
        try { setUserEmail((jwtDecode(t) as any).email || "") } catch { /* ignore */ }
    }, [])

    // Track draft count (add + edit drafts) for the Drafts badge.
    useEffect(() => {
        const count = () =>
            Object.keys(localStorage).filter((k) => /^mongoedit:(draft|editdraft):/.test(k)).length
        setDraftCount(count())
        const update = () => setDraftCount(count())
        window.addEventListener("mongoedit:saved", update)
        window.addEventListener("storage", update)
        return () => {
            window.removeEventListener("mongoedit:saved", update)
            window.removeEventListener("storage", update)
        }
    }, [])

    const isHome = pathname === "/"
    const onChart = pathname.startsWith("/chart")
    const onDrafts = pathname.startsWith("/drafts")

    const goView = (v: NavBarTab) => {
        if (onViewChange) onViewChange(v)
        else router.push(`/?view=${v}`)
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.replace("/login")
    }

    const editorActive = isHome && view === "data"
    const auditActive = isHome && view === "audit"

    return (
        <header className="flex-shrink-0 bg-white border-b border-neutral-200">
            <div className="flex items-center h-14 px-5 gap-4">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2">
                    <BrandMark />
                    <span className="text-[15px] font-semibold tracking-tight text-neutral-900">Montra</span>
                </Link>

                <div className="hidden lg:block w-px h-6 bg-neutral-200" />

                {/* Desktop nav — Editor / Audit Log / Chart / Drafts in one row */}
                <nav className="hidden lg:flex items-center gap-1">
                    <button onClick={() => goView("data")} className={`${ITEM_BASE} cursor-pointer ${editorActive ? ITEM_ACTIVE : ITEM_IDLE}`}>
                        <Table2 className="h-4 w-4" />
                        Editor
                    </button>
                    <button onClick={() => goView("audit")} className={`${ITEM_BASE} cursor-pointer ${auditActive ? ITEM_ACTIVE : ITEM_IDLE}`}>
                        <History className="h-4 w-4" />
                        Audit Log
                    </button>
                    <Link href="/chart" className={`${ITEM_BASE} ${onChart ? ITEM_ACTIVE : ITEM_IDLE}`}>
                        <BarChart2 className="h-4 w-4" />
                        Chart
                    </Link>
                    <Link href="/drafts" className={`${ITEM_BASE} ${onDrafts ? ITEM_ACTIVE : ITEM_IDLE}`}>
                        <FileText className="h-4 w-4" />
                        Drafts
                        <DraftBadge count={draftCount} />
                    </Link>
                </nav>

                {/* Right — user + logout (desktop) */}
                <div className="ml-auto hidden lg:flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-[11px] font-semibold text-white uppercase flex-shrink-0">
                            {userEmail.charAt(0) || "?"}
                        </div>
                        <span className="text-neutral-600 text-[12px] max-w-[160px] truncate leading-none">{userEmail}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 px-2.5 py-1.5 rounded-md hover:bg-neutral-100 text-[13px] font-medium cursor-pointer transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>

                {/* Mobile — hamburger */}
                <div className="ml-auto lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-md">
                                <MenuIcon className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[360px]">
                            <nav className="flex flex-col space-y-6 p-4">
                                {/* User */}
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-[12px] font-semibold text-white uppercase flex-shrink-0">
                                        {userEmail.charAt(0) || "?"}
                                    </div>
                                    <span className="text-sm text-neutral-700 truncate">{userEmail}</span>
                                </div>

                                {/* Nav items */}
                                <div className="space-y-1">
                                    <SheetClose asChild>
                                        <button onClick={() => goView("data")} className={`w-full ${ITEM_BASE} ${editorActive ? ITEM_ACTIVE : ITEM_IDLE}`}>
                                            <Table2 className="h-4 w-4" />
                                            Editor
                                        </button>
                                    </SheetClose>
                                    <SheetClose asChild>
                                        <button onClick={() => goView("audit")} className={`w-full ${ITEM_BASE} ${auditActive ? ITEM_ACTIVE : ITEM_IDLE}`}>
                                            <History className="h-4 w-4" />
                                            Audit Log
                                        </button>
                                    </SheetClose>
                                    <SheetClose asChild>
                                        <Link href="/chart" className={`${ITEM_BASE} ${onChart ? ITEM_ACTIVE : ITEM_IDLE}`}>
                                            <BarChart2 className="h-4 w-4" />
                                            Chart
                                        </Link>
                                    </SheetClose>
                                    <SheetClose asChild>
                                        <Link href="/drafts" className={`${ITEM_BASE} ${onDrafts ? ITEM_ACTIVE : ITEM_IDLE}`}>
                                            <FileText className="h-4 w-4" />
                                            Drafts
                                            <DraftBadge count={draftCount} />
                                        </Link>
                                    </SheetClose>
                                </div>

                                {/* Logout */}
                                <SheetClose asChild>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </button>
                                </SheetClose>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
