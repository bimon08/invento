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
    value: string; // comma-separated brands e.g. "Realme, Samsung"
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

    // Parse value into array
    const selectedBrands = value
        ? value.split(",").map((b) => b.trim()).filter(Boolean)
        : [];

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

    const toggleBrand = (brand: string) => {
        if (selectedBrands.includes(brand)) {
            // Remove brand
            const updated = selectedBrands.filter((b) => b !== brand);
            onChange(updated.join(", "));
        } else {
            // Add brand
            const updated = [...selectedBrands, brand];
            onChange(updated.join(", "));
        }
        setSearch("");
    };

    const removeBrand = (brand: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const updated = selectedBrands.filter((b) => b !== brand);
        onChange(updated.join(", "));
    };

    const handleCreate = async () => {
        const name = search.trim();
        if (!name) return;

        setIsCreating(true);
        try {
            await createBrand({ name });
            setSavedBrands((prev) => Array.from(new Set([...prev, name])).sort());
            toggleBrand(name);
        } catch {
            toggleBrand(name);
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
                    "flex min-h-[2.75rem] w-full items-center justify-between rounded-xl border bg-slate-800 px-3 py-1.5 text-sm text-left transition-all",
                    isOpen
                        ? "border-indigo-500 ring-2 ring-indigo-500/20"
                        : "border-slate-700 hover:border-slate-600"
                )}
            >
                <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
                    {selectedBrands.length > 0 ? (
                        selectedBrands.map((brand) => (
                            <span
                                key={brand}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300"
                            >
                                {brand}
                                <span
                                    onClick={(e) => removeBrand(brand, e)}
                                    className="rounded-sm p-0.5 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </span>
                            </span>
                        ))
                    ) : (
                        <span className="text-slate-500">Select brands...</span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                    {selectedBrands.length > 0 && (
                        <span
                            onClick={handleClear}
                            className="rounded p-0.5 text-slate-500 hover:text-white cursor-pointer"
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
                                        toggleBrand(filtered[0]);
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

                        {filtered.map((brand) => {
                            const isSelected = selectedBrands.includes(brand);
                            return (
                                <button
                                    type="button"
                                    key={brand}
                                    onClick={() => toggleBrand(brand)}
                                    className={cn(
                                        "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-slate-800",
                                        isSelected
                                            ? "text-indigo-400 bg-indigo-500/5"
                                            : "text-slate-300"
                                    )}
                                >
                                    {/* Checkbox indicator */}
                                    <div
                                        className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                            isSelected
                                                ? "border-indigo-500 bg-indigo-500"
                                                : "border-slate-600 bg-slate-800"
                                        )}
                                    >
                                        {isSelected && (
                                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                                    {brand}
                                </button>
                            );
                        })}

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
