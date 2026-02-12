"use client";

import { useState, useTransition, useEffect } from "react";
import { Drawer } from "vaul";
import { updateProduct, deleteProduct } from "@/actions/inventory";
import { toast } from "sonner";
import {
    Loader2,
    Save,
    Trash2,
    Pencil,
    Tag,
    DollarSign,
    Hash,
    Bell,
    Type,
} from "lucide-react";
import { CategorySelect } from "./CategorySelect";
import { BrandSelect } from "./BrandSelect";
import type { Product } from "@/db/schema";

interface EditProductDrawerProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProductDrawer({
    product,
    open,
    onOpenChange,
}: EditProductDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [minStock, setMinStock] = useState("");

    // Sync form fields whenever the drawer opens with a product
    useEffect(() => {
        if (open && product) {
            setName(product.name);
            setBrand(product.brand || "");
            setModel(product.model || "");
            setCategory(product.category || "");
            setPrice(product.price.toString());
            setStock(product.stock.toString());
            setMinStock(product.minStock.toString());
            setShowDeleteConfirm(false);
        }
    }, [open, product]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        startTransition(async () => {
            const [, error] = await updateProduct({
                id: product.id,
                name,
                brand,
                model,
                category,
                price: parseFloat(price) || 0,
                stock: parseInt(stock) || 0,
                minStock: parseInt(minStock) || 5,
            });

            if (error) {
                toast.error("Failed to update product", {
                    description: error.message,
                });
            } else {
                toast.success("Product updated", {
                    description: `${name} has been updated.`,
                });
                onOpenChange(false);
            }
        });
    };

    const handleDelete = () => {
        if (!product) return;

        setIsDeleting(true);
        startTransition(async () => {
            const [, error] = await deleteProduct({ id: product.id });

            if (error) {
                toast.error("Failed to delete product");
            } else {
                toast.success("Product deleted", {
                    description: `${product.name} has been removed.`,
                });
                onOpenChange(false);
            }
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        });
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange} handleOnly>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-t border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 max-h-[90dvh]">
                    <Drawer.Handle className="mx-auto mt-3 mb-0 h-1.5 w-12 shrink-0 rounded-full bg-slate-700" />

                    <div className="mx-auto w-full max-w-lg overflow-y-auto overscroll-contain px-5 pb-8 pt-4" style={{ maxHeight: "85dvh" }}>
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20">
                                    <Pencil className="h-5 w-5 text-indigo-400" />
                                </div>
                                <Drawer.Title className="text-xl font-bold text-white">
                                    Edit Product
                                </Drawer.Title>
                            </div>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex h-9 items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 active:scale-95"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="h-9 rounded-xl border border-slate-700 px-3 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex h-9 items-center gap-1.5 rounded-xl bg-red-500 px-3 text-xs font-medium text-white transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                        Confirm
                                    </button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* ── Product Info Section ── */}
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-800/30 p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Type className="h-3.5 w-3.5 text-slate-500" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        Product Info
                                    </span>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>

                                {/* Model */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                        Model
                                    </label>
                                    <input
                                        type="text"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        placeholder="e.g. iPhone 15 Pro Max"
                                        autoComplete="off"
                                        className="h-11 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* ── Classification Section ── */}
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-800/30 p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        Classification
                                    </span>
                                </div>

                                {/* Brand */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                        Brand
                                    </label>
                                    <BrandSelect
                                        value={brand}
                                        onChange={setBrand}
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                        Category
                                    </label>
                                    <CategorySelect
                                        value={category}
                                        onChange={setCategory}
                                    />
                                </div>
                            </div>

                            {/* ── Pricing & Stock Section ── */}
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-800/30 p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        Pricing & Stock
                                    </span>
                                </div>

                                {/* Price & Stock */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                            Price (₹)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="h-11 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 pl-8 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                            Stock
                                        </label>
                                        <div className="relative">
                                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                                            <input
                                                type="number"
                                                min="0"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                                className="h-11 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Min Stock */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                        <Bell className="h-3 w-3" />
                                        Low Stock Alert at
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={minStock}
                                        onChange={(e) => setMinStock(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isPending || !name}
                                className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ height: "52px" }}
                            >
                                {isPending && !isDeleting ? (
                                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                ) : (
                                    <Save className="h-4.5 w-4.5" />
                                )}
                                {isPending && !isDeleting ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
