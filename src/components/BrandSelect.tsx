"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Smartphone, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrands, createBrand } from "@/actions/inventory";

const DEFAULT_BRANDS = [
    "Apple",
    "Samsung",
    "OnePlus",
    "Xiaomi",
    "Realme",
    "Oppo",
    "Vivo",
    "Motorola",
    "Nokia",
    "Google",
    "Nothing",
    "iQOO",
    "Poco",
    "Redmi",
    "Huawei",
    "Honor",
    "Lenovo",
    "Asus",
    "Sony",
    "LG",
    "Other",
];

interface BrandSelectProps {
    value: string;
    onChange: (value: string) => void;
    existingBrands?: string[];
}

export function BrandSelect({
    value,
    onChange,
    existingBrands = [],
}: BrandSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [savedBrands, setSavedBrands] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load saved brands from DB on first open
    useEffect(() => {
        if (isOpen && savedBrands.length === 0) {
            getBrands().then(([data]) => {
                if (data) setSavedBrands(data);
            });
        }
    }, [isOpen, savedBrands.length]);

    const allBrands = Array.from(
        new Set([...savedBrands, ...existingBrands, ...DEFAULT_BRANDS])
    ).sort();

    const filtered = search
        ? allBrands.filter((b) =>
            b.toLowerCase().includes(search.toLowerCase())
        )
        : allBrands;

    const showCreateOption =
        search.trim() &&
        !allBrands.some(
            (b) => b.toLowerCase() === search.trim().toLowerCase()
        );

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSelect = (brand: string) => {
        onChange(brand);
        setIsOpen(false);
        setSearch("");
    };

    const handleCreate = async () => {
        const name = search.trim();
        if (!name) return;

        setIsCreating(true);
        try {
            await createBrand({ name });
            setSavedBrands((prev) => Array.from(new Set([...prev, name])).sort());
            onChange(name);
            setIsOpen(false);
            setSearch("");
        } catch {
            onChange(name);
            setIsOpen(false);
            setSearch("");
        } finally {
            setIsCreating(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    return (
        <div className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearch("");
                }}
                className={cn(
                    "flex h-11 w-full items-center justify-between rounded-xl border bg-slate-800 px-3 text-sm text-left transition-all",
                    isOpen
                        ? "border-indigo-500 ring-2 ring-indigo-500/20"
                        : "border-slate-700 hover:border-slate-600"
                )}
            >
                <span className={cn("truncate", value ? "text-white" : "text-slate-500")}>
                    {value || "Select brand..."}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <span
                            onClick={handleClear}
                            className="rounded p-0.5 text-slate-500 hover:text-white"
                        >
                            <X className="h-3 w-3" />
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            "h-3.5 w-3.5 text-slate-500 transition-transform",
                            isOpen && "rotate-180"
                        )}
                    />
                </div>
            </button>

            {/* Inline dropdown — expands within flow */}
            {isOpen && (
                <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
                    {/* Search */}
                    <div className="border-b border-slate-800 p-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (showCreateOption) {
                                        handleCreate();
                                    } else if (filtered.length > 0) {
                                        handleSelect(filtered[0]);
                                    }
                                }
                            }}
                            placeholder="Search or type new..."
                            className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Options */}
                    <div className="max-h-40 overflow-y-auto py-1">
                        {showCreateOption && (
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/10 disabled:opacity-50"
                            >
                                {isCreating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                )}
                                Create &ldquo;{search.trim()}&rdquo;
                            </button>
                        )}

                        {filtered.map((brand) => (
                            <button
                                type="button"
                                key={brand}
                                onClick={() => handleSelect(brand)}
                                className={cn(
                                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-slate-800",
                                    brand === value
                                        ? "text-indigo-400 bg-indigo-500/5"
                                        : "text-slate-300"
                                )}
                            >
                                <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                                {brand}
                            </button>
                        ))}

                        {filtered.length === 0 && !showCreateOption && (
                            <p className="px-3.5 py-3 text-sm text-slate-500 text-center">
                                No brands found
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
