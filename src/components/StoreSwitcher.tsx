"use client";

import { useState, useRef, useEffect } from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Store, ChevronDown, Plus, Check, Loader2 } from "lucide-react";

export function StoreSwitcher() {
    const { organization } = useOrganization();
    const { isLoaded, userMemberships, setActive, createOrganization } =
        useOrganizationList({
            userMemberships: { infinite: true },
        });

    const [open, setOpen] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
                setShowCreate(false);
                setNewName("");
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (!isLoaded) return null;

    const handleSwitch = async (orgId: string) => {
        if (!setActive) return;
        await setActive({ organization: orgId });
        setOpen(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createOrganization || !newName.trim()) return;

        setIsCreating(true);
        try {
            await createOrganization({ name: newName.trim() });
            setNewName("");
            setShowCreate(false);
            setOpen(false);
        } catch {
            // Error handling
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/80 px-3 py-2 text-sm transition-all hover:border-slate-600 hover:bg-slate-800"
            >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                    {organization?.name?.[0]?.toUpperCase() || "S"}
                </div>
                <span className="max-w-[120px] truncate text-slate-300">
                    {organization?.name || "Select store"}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
                    {/* Header */}
                    <div className="border-b border-slate-800 px-4 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Your Stores
                        </p>
                    </div>

                    {/* Store list */}
                    <div className="max-h-48 overflow-y-auto p-1.5">
                        {userMemberships?.data?.map((mem) => (
                            <button
                                key={mem.organization.id}
                                onClick={() => handleSwitch(mem.organization.id)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-slate-800"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                                    {mem.organization.name[0].toUpperCase()}
                                </div>
                                <span className="flex-1 truncate text-left text-slate-300">
                                    {mem.organization.name}
                                </span>
                                {organization?.id === mem.organization.id && (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Create new */}
                    <div className="border-t border-slate-800 p-1.5">
                        {!showCreate ? (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/10"
                            >
                                <Plus className="h-4 w-4" />
                                Create new store
                            </button>
                        ) : (
                            <form onSubmit={handleCreate} className="flex gap-2 px-2 py-1.5">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Store name"
                                    className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={isCreating || !newName.trim()}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
                                >
                                    {isCreating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
