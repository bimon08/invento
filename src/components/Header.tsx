"use client";

import { Package, Store } from "lucide-react";
import { useOrganization } from "@clerk/nextjs";
import { UserMenu } from "./UserMenu";
import Link from "next/link";

interface HeaderProps {
    totalValue?: number;
    /** If present, user is a staff member */
    staffUsername?: string;
    /** Store name for staff view */
    storeName?: string;
}

export function Header({ totalValue, staffUsername, storeName }: HeaderProps) {
    const { organization } = useOrganization();

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

                {/* Right side — unified menu for both admin and staff */}
                <UserMenu
                    totalValue={totalValue}
                    staffUsername={staffUsername}
                    storeName={storeName}
                />
            </div>
        </header>
    );
}
