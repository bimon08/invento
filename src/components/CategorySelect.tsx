"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_CATEGORIES = [
    "Screens",
    "Batteries",
    "Chargers",
    "Cables",
    "Cases & Covers",
    "Tools",
    "Spare Parts",
    "Accessories",
    "Other",
];

interface CategorySelectProps {
    value: string;
    onChange: (value: string) => void;
    existingCategories?: string[];
}

export function CategorySelect({
    value,
    onChange,
    existingCategories = [],
}: CategorySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Merge defaults with existing categories (deduplicated)
    const allCategories = Array.from(
        new Set([...existingCategories, ...DEFAULT_CATEGORIES])
    ).sort();

    const filtered = search
        ? allCategories.filter((c) =>
            c.toLowerCase().includes(search.toLowerCase())
        )
        : allCategories;

    const showCreateOption =
        search.trim() &&
        !allCategories.some(
            (c) => c.toLowerCase() === search.trim().toLowerCase()
        );

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
                setSearch("");
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen]);

    const handleSelect = (cat: string) => {
        onChange(cat);
        setIsOpen(false);
        setSearch("");
    };

    const handleCreate = () => {
        if (search.trim()) {
            onChange(search.trim());
            setIsOpen(false);
            setSearch("");
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger / Input */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }
                }}
                className={cn(
                    "flex h-12 w-full items-center justify-between rounded-xl border bg-slate-800 px-4 text-sm text-left transition-all",
                    isOpen
                        ? "border-indigo-500 ring-2 ring-indigo-500/20"
                        : "border-slate-700 hover:border-slate-600"
                )}
            >
                <span className={value ? "text-white" : "text-slate-500"}>
                    {value || "Select category..."}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-slate-500 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
                    {/* Search Input */}
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

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto py-1">
                        {/* Create new option */}
                        {showCreateOption && (
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/10"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Create &ldquo;{search.trim()}&rdquo;
                            </button>
                        )}

                        {filtered.map((cat) => (
                            <button
                                type="button"
                                key={cat}
                                onClick={() => handleSelect(cat)}
                                className={cn(
                                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-slate-800",
                                    cat === value
                                        ? "text-indigo-400 bg-indigo-500/5"
                                        : "text-slate-300"
                                )}
                            >
                                <Tag className="h-3.5 w-3.5 text-slate-500" />
                                {cat}
                            </button>
                        ))}

                        {filtered.length === 0 && !showCreateOption && (
                            <p className="px-3.5 py-3 text-sm text-slate-500 text-center">
                                No categories found
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
