"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import {
    BarChart2, ChevronDown, FileText, HelpCircle, History, LogOut,
    MenuIcon, Plus, Search, Settings, Table2,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export type NavView = "collections" | "audit" | "charts" | "drafts"

type Room = { _id: string; name: string }

interface NavBarMenuProps {
    /** The active view. When omitted the navbar runs in standalone mode (links navigate to `/`). */
    view?: NavView
    onViewChange?: (view: NavView) => void
    /** Clusters (rooms) for the selector dropdown. */
    rooms?: Room[]
    activeRoomId?: string | null
    onSelectRoom?: (id: string) => void
    /** Opens the cluster management modal. */
    onManageClusters?: () => void
    /** When provided, the search box becomes functional (filters the collection list). */
    search?: string
    onSearchChange?: (value: string) => void
    searchPlaceholder?: string
    /** When provided, renders a "New collection" button next to the help icon. */
    onNewCollection?: () => void
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

const NAV_ITEMS: { id: NavView; label: string; icon: typeof Table2 }[] = [
    { id: "collections", label: "Collections", icon: Table2 },
    { id: "audit", label: "Audit Logs", icon: History },
    { id: "charts", label: "Charts", icon: BarChart2 },
    { id: "drafts", label: "Drafts", icon: FileText },
]

function DraftBadge({ count }: { count: number }) {
    if (count <= 0) return null
    return (
        <span className="ml-0.5 text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-px leading-none">
            {count}
        </span>
    )
}

export function NavBarMenu({
    view,
    onViewChange,
    rooms = [],
    activeRoomId,
    onSelectRoom,
    onManageClusters,
    search,
    onSearchChange,
    searchPlaceholder = "Search",
    onNewCollection,
}: NavBarMenuProps) {
    const router = useRouter()
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

    const goView = (v: NavView) => {
        if (onViewChange) onViewChange(v)
        else router.push(`/?view=${v}`)
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.replace("/login")
    }

    const activeRoom = rooms.find((r) => r._id === activeRoomId)
    const avatarLetter = (userEmail.charAt(0) || "?").toUpperCase()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white flex-shrink-0">
            <div className="flex h-14 w-full items-center gap-2 px-4 sm:px-5 lg:px-6">

                {/* LEFT — brand + cluster selector */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Mobile hamburger */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-md text-neutral-500">
                                    <MenuIcon className="h-5 w-5" />
                                    <span className="sr-only">Toggle navigation menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[360px]">
                                <nav className="flex flex-col gap-6 p-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-neutral-900 grid place-items-center text-[12px] font-semibold text-white">
                                            {avatarLetter}
                                        </div>
                                        <span className="text-sm text-neutral-700 truncate">{userEmail}</span>
                                    </div>

                                    {rooms.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Cluster</p>
                                            {rooms.map((room) => (
                                                <SheetClose asChild key={room._id}>
                                                    <button
                                                        onClick={() => onSelectRoom?.(room._id)}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] ${room._id === activeRoomId ? "bg-neutral-100 text-neutral-900 font-medium" : "text-neutral-600 hover:bg-neutral-50"}`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${room._id === activeRoomId ? "bg-neutral-900" : "bg-neutral-300"}`} />
                                                        <span className="truncate font-mono">{room.name}</span>
                                                    </button>
                                                </SheetClose>
                                            ))}
                                            <SheetClose asChild>
                                                <button onClick={onManageClusters} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-neutral-600 hover:bg-neutral-50">
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Manage clusters
                                                </button>
                                            </SheetClose>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                                            <SheetClose asChild key={id}>
                                                <button
                                                    onClick={() => goView(id)}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium ${view === id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    {label}
                                                    {id === "drafts" && <DraftBadge count={draftCount} />}
                                                </button>
                                            </SheetClose>
                                        ))}
                                    </div>

                                    <SheetClose asChild>
                                        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </button>
                                    </SheetClose>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-2">
                        <BrandMark />
                        <span className="text-[16px] font-semibold tracking-tight text-neutral-950">Montra</span>
                    </Link>

                    <span className="hidden h-6 w-px bg-neutral-200 md:block" />

                    {/* Cluster selector */}
                    {rooms.length > 0 && (
                        <div className="hidden md:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 h-[34px] pl-3 pr-2.5 max-w-[220px] rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-colors cursor-pointer">
                                        <span className="w-2 h-2 rounded-full bg-neutral-900 flex-shrink-0" />
                                        <span className="truncate font-mono text-[13px] text-neutral-900">
                                            {activeRoom?.name ?? "Select cluster"}
                                        </span>
                                        <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-72">
                                    <p className="px-2 pb-1.5 pt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Clusters</p>
                                    {rooms.map((room) => (
                                        <DropdownMenuItem
                                            key={room._id}
                                            onClick={() => onSelectRoom?.(room._id)}
                                            className="gap-2"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-neutral-900 flex-shrink-0" />
                                            <span className="truncate font-mono text-[13px] text-neutral-900 flex-1">{room.name}</span>
                                            {room._id === activeRoomId && (
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onManageClusters} className="gap-2 text-neutral-600">
                                        <Plus className="w-3.5 h-3.5" />
                                        Manage clusters
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* CENTER — primary nav */}
                <nav className="hidden lg:flex lg:flex-1 min-w-0 justify-center">
                    <ul className="flex items-center gap-1">
                        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                            const active = view === id
                            return (
                                <li key={id}>
                                    <button
                                        onClick={() => goView(id)}
                                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                        {id === "drafts" && <DraftBadge count={draftCount} />}
                                        {active && <span className="absolute left-3 right-3 -bottom-[7px] h-[2px] rounded bg-neutral-950" />}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Spacer so the right cluster stays right when center nav is hidden */}
                <div className="flex-1 lg:hidden" />

                {/* RIGHT — search + actions + avatar */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Search — functional when onSearchChange is provided, else decorative */}
                    {onSearchChange ? (
                        <label className="hidden md:inline-flex items-center gap-2 h-[34px] pl-2.5 pr-2 w-44 lg:w-52 rounded-lg border border-neutral-200 bg-neutral-50 focus-within:bg-white focus-within:border-neutral-300 text-[13px] transition-colors">
                            <Search className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                            <input
                                value={search ?? ""}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="min-w-0 flex-1 bg-transparent outline-none text-neutral-900 placeholder-neutral-400"
                            />
                        </label>
                    ) : (
                        <span className="hidden md:inline-flex items-center gap-2 h-[34px] pl-2.5 pr-2 w-44 lg:w-52 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 text-[13px] cursor-default" aria-hidden="true">
                            <Search className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Search</span>
                            <span className="ml-auto font-mono text-[11px] text-neutral-500 bg-white border border-neutral-200 rounded px-1.5 py-0.5">⌘K</span>
                        </span>
                    )}

                    <button className="hidden lg:grid place-items-center w-[34px] h-[34px] rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 cursor-default" tabIndex={-1} aria-hidden="true">
                        <HelpCircle className="w-[18px] h-[18px]" />
                    </button>

                    {/* New collection — contextual action next to help */}
                    {onNewCollection && (
                        <button
                            onClick={onNewCollection}
                            className="hidden md:inline-flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[12px] font-semibold bg-neutral-900 hover:bg-neutral-700 text-white cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New collection
                        </button>
                    )}

                    {/* Avatar menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="grid place-items-center w-[34px] h-[34px] rounded-full bg-neutral-900 text-white text-[13px] font-semibold cursor-pointer hover:ring-2 hover:ring-neutral-100">
                                {avatarLetter}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <div className="flex items-center gap-3 px-2 py-2">
                                <span className="grid place-items-center w-9 h-9 rounded-full bg-neutral-900 text-white text-[14px] font-semibold flex-shrink-0">
                                    {avatarLetter}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-neutral-900">{userEmail.split("@")[0] || "Account"}</p>
                                    <p className="truncate font-mono text-[11px] text-neutral-500">{userEmail}</p>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onManageClusters} className="gap-2.5">
                                <Settings className="w-4 h-4 text-neutral-500" />
                                Manage clusters
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="gap-2.5 text-red-600 focus:text-red-600">
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
