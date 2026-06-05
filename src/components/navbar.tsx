"use client"

import Link from "next/link"
import { BarChart2, FileText, LogOut, MenuIcon } from "lucide-react"

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export type NavBarTab = "data" | "audit"

interface NavBarMenuProps {
    tab: NavBarTab
    onTabChange: (tab: NavBarTab) => void
    draftCount: number
    userEmail: string
    onLogout: () => void
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

const TABS: { value: NavBarTab; label: string }[] = [
    { value: "data", label: "Data" },
    { value: "audit", label: "Audit Log" },
]

export function NavBarMenu({ tab, onTabChange, draftCount, userEmail, onLogout }: NavBarMenuProps) {
    return (
        <header className="flex-shrink-0 px-3 pt-3">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-between px-4 py-2 bg-gray-200/80 backdrop-blur shadow-2xs shadow-black rounded-2xl">
                {/* Left — Brand + links */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2">
                        <BrandMark />
                        <span className="text-[15px] font-semibold tracking-tight text-neutral-900">Montra</span>
                    </Link>
                    <div className="w-px h-5 bg-neutral-400/50 mx-1" />
                    <NavigationMenu viewport={false}>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/chart" className="flex-row items-center gap-1.5">
                                        <BarChart2 className="h-4 w-4" />
                                        Chart
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/drafts" className="flex-row items-center gap-1.5">
                                        <FileText className="h-4 w-4" />
                                        Drafts
                                        {draftCount > 0 && (
                                            <span className="text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-px leading-none">
                                                {draftCount}
                                            </span>
                                        )}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Center — Tabs */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white/70 rounded-lg p-1 border border-neutral-300/70">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => onTabChange(t.value)}
                            className={`px-5 py-1.5 rounded-md text-[12px] font-medium cursor-pointer transition-all
                                ${tab === t.value
                                    ? "bg-neutral-900 text-white shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-900"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Right — User + Logout */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/70 border border-neutral-300/70 rounded-lg px-2.5 py-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#7c8cf8] flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
                            {userEmail.charAt(0) || "?"}
                        </div>
                        <span className="text-neutral-600 text-[11px] max-w-[150px] truncate leading-none">{userEmail}</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 px-2.5 py-1.5 rounded-lg hover:bg-white/70 border border-transparent hover:border-neutral-300/70 text-[12px] cursor-pointer transition-all"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-gray-200/80 backdrop-blur shadow-2xs shadow-black rounded-2xl">
                <Link href="/" className="flex items-center gap-2">
                    <BrandMark />
                    <span className="text-[15px] font-semibold tracking-tight text-neutral-900">Montra</span>
                </Link>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="bg-white/70 backdrop-blur shadow-2xs shadow-black rounded-xl"
                        >
                            <MenuIcon className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[360px]">
                        <nav className="flex flex-col space-y-6 p-4">
                            {/* User */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#7c8cf8] flex items-center justify-center text-[12px] font-bold text-white uppercase flex-shrink-0">
                                    {userEmail.charAt(0) || "?"}
                                </div>
                                <span className="text-sm text-neutral-700 truncate">{userEmail}</span>
                            </div>

                            {/* View tabs */}
                            <div className="space-y-2">
                                <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">View</h3>
                                <div className="space-y-1">
                                    {TABS.map((t) => (
                                        <SheetClose asChild key={t.value}>
                                            <button
                                                onClick={() => onTabChange(t.value)}
                                                className={`block w-full text-left px-2 py-2 text-sm rounded-md transition-colors
                                                    ${tab === t.value
                                                        ? "bg-neutral-900 text-white"
                                                        : "hover:bg-gray-100"
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        </SheetClose>
                                    ))}
                                </div>
                            </div>

                            {/* Quick links */}
                            <div className="space-y-2">
                                <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Quick Links</h3>
                                <div className="space-y-1">
                                    <SheetClose asChild>
                                        <Link href="/chart" className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-gray-100 rounded-md">
                                            <BarChart2 className="h-4 w-4" />
                                            Chart
                                        </Link>
                                    </SheetClose>
                                    <SheetClose asChild>
                                        <Link href="/drafts" className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-gray-100 rounded-md">
                                            <FileText className="h-4 w-4" />
                                            Drafts
                                            {draftCount > 0 && (
                                                <span className="text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-px leading-none">
                                                    {draftCount}
                                                </span>
                                            )}
                                        </Link>
                                    </SheetClose>
                                </div>
                            </div>

                            {/* Logout */}
                            <SheetClose asChild>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </SheetClose>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    )
}
