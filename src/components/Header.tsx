"use client";

import { useState } from "react";
import { Package, Store, LogOut, User, Loader2 } from "lucide-react";
import { useOrganization } from "@clerk/nextjs";
import { UserMenu } from "./UserMenu";
import { broadcastLogout } from "@/lib/auth-sync";
import Link from "next/link";

interface HeaderProps {
    totalValue?: number;
    /** If present, user is a staff member (not Clerk admin) */
    staffUsername?: string;
    /** Store name for staff view */
    storeName?: string;
}

export function Header({ totalValue, staffUsername, storeName }: HeaderProps) {
    const { organization } = useOrganization();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleStaffLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/staff", { method: "DELETE" });
            broadcastLogout();
            window.location.href = "/sign-in";
        } catch {
            setLoggingOut(false);
        }
    };

    // Determine store name — from Clerk org (admin) or from prop (staff)
    const displayStoreName = organization?.name || storeName;

    return (
        <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                {/* Logo + Store Name */}
                <Link href="/" className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                        <Package className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
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

                {/* Right side */}
                {staffUsername ? (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/80 px-3 py-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                                <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-medium text-slate-200">{staffUsername}</span>
                        </div>
                        <button
                            onClick={handleStaffLogout}
                            disabled={loggingOut}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/80 text-slate-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >
                            {loggingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                ) : (
                    <UserMenu totalValue={totalValue} />
                )}
            </div>
        </header>
    );
}
