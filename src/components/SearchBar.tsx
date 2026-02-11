"use client";

import { useQueryState } from "nuqs";
import { Search, X } from "lucide-react";
import { useTransition } from "react";

export function SearchBar() {
    const [search, setSearch] = useQueryState("q", {
        defaultValue: "",
        shallow: false,
        throttleMs: 300,
    });
    const [isPending, startTransition] = useTransition();

    return (
        <div className="sticky top-16 z-30 border-b border-slate-800/50 bg-slate-950/80 px-4 py-3 backdrop-blur-xl">
            <div className="relative mx-auto max-w-7xl">
                <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => {
                        startTransition(() => {
                            setSearch(e.target.value || null);
                        });
                    }}
                    className="h-11 w-full rounded-xl border border-slate-700/50 bg-slate-800/50 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 outline-none ring-indigo-500/50 transition-all focus:border-indigo-500/50 focus:bg-slate-800 focus:ring-2"
                />
                {search && (
                    <button
                        onClick={() => setSearch(null)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                {isPending && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                )}
            </div>
        </div>
    );
}
