"use client";

import { useState, useEffect, useRef } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
    Loader2,
    Trash2,
    Tag,
    Smartphone,
    Pencil,
    Plus,
    Check,
    X,
    Settings,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
    getCategoriesWithIds,
    getBrandsWithIds,
    createCategory,
    createBrand,
    updateCategory,
    updateBrand,
    deleteCategory,
    deleteBrand,
} from "@/actions/inventory";

interface ItemData {
    id: string;
    name: string;
    orgId: string;
    createdAt: string;
}

type ActiveTab = "categories" | "brands";

export function SettingsManager() {
    const { organization, membership } = useOrganization();
    const isAdmin = membership?.role === "org:admin";

    const [activeTab, setActiveTab] = useState<ActiveTab>("categories");
    const [categoriesList, setCategoriesList] = useState<ItemData[]>([]);
    const [brandsList, setBrandsList] = useState<ItemData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const editInputRef = useRef<HTMLInputElement>(null);
    const newInputRef = useRef<HTMLInputElement>(null);

    // Load data
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [catData] = await getCategoriesWithIds();
                const [brandData] = await getBrandsWithIds();
                if (catData) setCategoriesList(catData);
                if (brandData) setBrandsList(brandData);
            } catch {
                toast.error("Failed to load settings data");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Focus edit input
    useEffect(() => {
        if (editingId) {
            setTimeout(() => editInputRef.current?.focus(), 50);
        }
    }, [editingId]);

    // Focus new input
    useEffect(() => {
        if (showAddForm) {
            setTimeout(() => newInputRef.current?.focus(), 50);
        }
    }, [showAddForm]);

    if (!isAdmin) {
        return (
            <div className="mx-auto max-w-lg px-4 py-20 text-center">
                <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                        <Settings className="h-8 w-8 text-red-400" />
                    </div>
                </div>
                <h2 className="mb-2 text-lg font-bold text-white">Access Denied</h2>
                <p className="text-sm text-slate-400">
                    Only admins can access store settings.
                </p>
            </div>
        );
    }

    const currentItems = activeTab === "categories" ? categoriesList : brandsList;

    const startEdit = (item: ItemData) => {
        setEditingId(item.id);
        setEditValue(item.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue("");
    };

    const handleSave = async (id: string) => {
        const trimmed = editValue.trim();
        if (!trimmed) return;

        setSavingId(id);
        try {
            if (activeTab === "categories") {
                const [result] = await updateCategory({ id, name: trimmed });
                if (result) {
                    setCategoriesList((prev) =>
                        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
                    );
                    toast.success("Category updated");
                }
            } else {
                const [result] = await updateBrand({ id, name: trimmed });
                if (result) {
                    setBrandsList((prev) =>
                        prev.map((b) => (b.id === id ? { ...b, name: trimmed } : b))
                    );
                    toast.success("Brand updated");
                }
            }
            cancelEdit();
        } catch {
            toast.error(`Failed to update ${activeTab === "categories" ? "category" : "brand"}`);
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This won't remove it from existing products.`)) return;

        setDeletingId(id);
        try {
            if (activeTab === "categories") {
                await deleteCategory({ id });
                setCategoriesList((prev) => prev.filter((c) => c.id !== id));
                toast.success("Category deleted");
            } else {
                await deleteBrand({ id });
                setBrandsList((prev) => prev.filter((b) => b.id !== id));
                toast.success("Brand deleted");
            }
        } catch {
            toast.error(`Failed to delete ${activeTab === "categories" ? "category" : "brand"}`);
        } finally {
            setDeletingId(null);
        }
    };

    const handleCreate = async () => {
        const trimmed = newName.trim();
        if (!trimmed) return;

        setIsCreating(true);
        try {
            if (activeTab === "categories") {
                const [result] = await createCategory({ name: trimmed });
                if (result) {
                    setCategoriesList((prev) =>
                        [...prev, result as ItemData].sort((a, b) => a.name.localeCompare(b.name))
                    );
                    toast.success("Category created");
                }
            } else {
                const [result] = await createBrand({ name: trimmed });
                if (result) {
                    setBrandsList((prev) =>
                        [...prev, result as ItemData].sort((a, b) => a.name.localeCompare(b.name))
                    );
                    toast.success("Brand created");
                }
            }
            setNewName("");
            setShowAddForm(false);
        } catch {
            toast.error(`Failed to create ${activeTab === "categories" ? "category" : "brand"}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg px-4 py-6">
            {/* Title */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20">
                    <Settings className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Settings</h2>
                    <p className="text-xs text-slate-400">
                        Manage your store categories & brands
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="mb-5 flex rounded-xl border border-slate-700/50 bg-slate-900/80 p-1">
                <button
                    onClick={() => { setActiveTab("categories"); cancelEdit(); setShowAddForm(false); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === "categories"
                            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                            : "text-slate-400 hover:text-slate-300"
                        }`}
                >
                    <Tag className="h-3.5 w-3.5" />
                    Categories
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === "categories"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-slate-800 text-slate-500"
                        }`}>
                        {categoriesList.length}
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab("brands"); cancelEdit(); setShowAddForm(false); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === "brands"
                            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                            : "text-slate-400 hover:text-slate-300"
                        }`}
                >
                    <Smartphone className="h-3.5 w-3.5" />
                    Brands
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === "brands"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-slate-800 text-slate-500"
                        }`}>
                        {brandsList.length}
                    </span>
                </button>
            </div>

            {/* Items List */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-lg shadow-black/10 overflow-hidden">
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <h3 className="text-sm font-semibold text-white">
                        {activeTab === "categories" ? "Categories" : "Brands"}
                    </h3>
                    <button
                        onClick={() => { setShowAddForm(!showAddForm); cancelEdit(); }}
                        className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-all hover:bg-indigo-500/20 hover:border-indigo-500/50 active:scale-95"
                    >
                        <Plus className="h-3 w-3" />
                        Add New
                    </button>
                </div>

                {/* Add New Form */}
                {showAddForm && (
                    <div className="border-b border-slate-800 bg-indigo-500/5 p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            </div>
                            <input
                                ref={newInputRef}
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreate();
                                    if (e.key === "Escape") {
                                        setShowAddForm(false);
                                        setNewName("");
                                    }
                                }}
                                placeholder={`New ${activeTab === "categories" ? "category" : "brand"} name...`}
                                className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all"
                            />
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !newName.trim()}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-40"
                            >
                                {isCreating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Check className="h-3.5 w-3.5" />
                                )}
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewName(""); }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                    </div>
                ) : currentItems.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/50">
                            {activeTab === "categories" ? (
                                <Tag className="h-6 w-6 text-slate-600" />
                            ) : (
                                <Smartphone className="h-6 w-6 text-slate-600" />
                            )}
                        </div>
                        <p className="mb-1 text-sm font-medium text-slate-400">
                            No {activeTab} yet
                        </p>
                        <p className="text-xs text-slate-500">
                            Add your first {activeTab === "categories" ? "category" : "brand"} to get started
                        </p>
                    </div>
                ) : (
                    /* Items */
                    <div className="divide-y divide-slate-800/50">
                        {currentItems.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-800/30"
                            >
                                {/* Icon */}
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700/50">
                                    {activeTab === "categories" ? (
                                        <Tag className="h-4 w-4 text-slate-500" />
                                    ) : (
                                        <Smartphone className="h-4 w-4 text-slate-500" />
                                    )}
                                </div>

                                {/* Content */}
                                {editingId === item.id ? (
                                    /* Edit mode */
                                    <div className="flex flex-1 items-center gap-2">
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSave(item.id);
                                                if (e.key === "Escape") cancelEdit();
                                            }}
                                            className="h-9 flex-1 rounded-lg border border-indigo-500 bg-slate-800 px-3 text-sm text-white outline-none ring-2 ring-indigo-500/20 transition-all"
                                        />
                                        <button
                                            onClick={() => handleSave(item.id)}
                                            disabled={savingId === item.id}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                                        >
                                            {savingId === item.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Check className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    /* View mode */
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {item.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-indigo-500/10 hover:text-indigo-400"
                                                aria-label="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, item.name)}
                                                disabled={deletingId === item.id}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                                aria-label="Delete"
                                            >
                                                {deletingId === item.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <p className="mt-4 text-center text-[11px] text-slate-600">
                Changes here won&apos;t affect existing products — only future selections.
            </p>
        </div>
    );
}
