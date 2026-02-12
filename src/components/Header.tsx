"use client";

import {
    Navbar,
    NavBody,
    MobileNav,
    MobileNavHeader,
    MobileNavToggle,
    MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { Package, Store, Sun, Moon, Users, LogOut } from "lucide-react";
import { useOrganization, useUser, useClerk } from "@clerk/nextjs";
import { useTheme } from "./ThemeProvider";
import { useRouter } from "next/navigation";
import { broadcastLogout } from "@/lib/auth-sync";
import Link from "next/link";
import { useState } from "react";

interface HeaderProps {
    totalValue?: number;
    staffUsername?: string;
    storeName?: string;
}

export function Header({ totalValue, staffUsername, storeName }: HeaderProps) {
    const { organization, membership } = useOrganization();
    const { user } = useUser();
    const { signOut } = useClerk();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const isStaff = !!staffUsername;
    const isAdmin = membership?.role === "org:admin";
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const displayStoreName = organization?.name || storeName;

    const initials = isStaff
        ? (staffUsername?.[0] || "S").toUpperCase()
        : (user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U").toUpperCase();

    const displayName = isStaff
        ? staffUsername
        : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.emailAddresses[0]?.emailAddress;

    const handleSignOut = async () => {
        broadcastLogout();
        if (isStaff) {
            await fetch("/api/staff", { method: "DELETE" });
            window.location.href = "/sign-in";
        } else {
            signOut(() => router.push("/sign-in"));
        }
    };

    const Logo = () => (
        <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <Package className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                    Invento
                </h1>
                {displayStoreName && (
                    <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate leading-tight">
                        <Store className="h-3 w-3 shrink-0 text-emerald-400" />
                        {displayStoreName}
                    </p>
                )}
            </div>
        </Link>
    );

    const UserAvatar = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
        const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
        const round = size === "sm" ? "rounded-lg" : "rounded-xl";
        return !isStaff && user?.imageUrl ? (
            <img
                src={user.imageUrl}
                alt={user.firstName || "User"}
                className={`${dim} ${round} object-cover`}
            />
        ) : (
            <div className={`flex ${dim} items-center justify-center ${round} bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white`}>
                {initials}
            </div>
        );
    };

    return (
        <Navbar>
            {/* ── Desktop ── */}
            <NavBody>
                <Logo />

                <div className="flex items-center gap-3">
                    {/* User info */}
                    <div className="flex items-center gap-2.5">
                        <UserAvatar />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white leading-tight truncate max-w-[140px]">
                                {displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                {isStaff ? "Staff" : isAdmin ? "Admin" : "Member"}
                            </p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700/50 mx-1" />

                    {/* Staff link */}
                    {!isStaff && isAdmin && (
                        <Link
                            href="/staff"
                            className="flex h-9 items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/80 px-3 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                        >
                            <Users className="h-3.5 w-3.5" />
                            Staff
                        </Link>
                    )}

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/80 text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    {/* Sign out */}
                    <button
                        onClick={handleSignOut}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/20"
                        aria-label="Sign out"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </button>
                </div>
            </NavBody>

            {/* ── Mobile ── */}
            <MobileNav>
                <MobileNavHeader>
                    <Logo />
                    <MobileNavToggle
                        isOpen={isMobileMenuOpen}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />
                </MobileNavHeader>

                <MobileNavMenu
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                >
                    {/* User info */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                        <UserAvatar size="lg" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                            <p className="text-[11px] text-slate-400">
                                {isStaff ? "Staff" : isAdmin ? "Admin" : "Member"}
                            </p>
                        </div>
                    </div>

                    {/* Store */}
                    {displayStoreName && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-slate-800/50 px-3 py-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                                {displayStoreName[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-200">{displayStoreName}</p>
                                <p className="text-[10px] text-slate-500">
                                    {isStaff ? "Staff member" : "Active store"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                        >
                            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
                            {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </button>

                        {!isStaff && isAdmin && (
                            <Link
                                href="/staff"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                            >
                                <Users className="h-4 w-4 text-slate-500" />
                                Staff
                            </Link>
                        )}

                        <button
                            onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </MobileNavMenu>
            </MobileNav>
        </Navbar>
    );
}
