"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { createProduct } from "@/actions/inventory";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { CategorySelect } from "./CategorySelect";

interface AddProductDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddProductDrawer({ open, onOpenChange }: AddProductDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [minStock, setMinStock] = useState("5");

    const resetForm = () => {
        setName("");
        setCategory("");
        setPrice("");
        setStock("");
        setMinStock("5");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const [, error] = await createProduct({
                name,
                category,
                price: parseFloat(price) || 0,
                stock: parseInt(stock) || 0,
                minStock: parseInt(minStock) || 5,
            });

            if (error) {
                toast.error("Failed to add product", {
                    description: error.message,
                });
            } else {
                toast.success("Product added", {
                    description: `${name} has been added to inventory.`,
                });
                resetForm();
                onOpenChange(false);
            }
        });
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex flex-col rounded-t-3xl border-t border-slate-700/50 bg-slate-900">
                    <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-slate-700" />

                    <div className="mx-auto w-full max-w-lg px-6 pb-8 pt-4">
                        <Drawer.Title className="mb-6 text-xl font-bold text-white">
                            Add Product
                        </Drawer.Title>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Name */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. iPhone 15 Screen"
                                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                                    Category
                                </label>
                                <CategorySelect
                                    value={category}
                                    onChange={setCategory}
                                />
                            </div>

                            {/* Price & Stock Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-400">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-400">
                                        Stock *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        placeholder="0"
                                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Min Stock */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                                    Low Stock Alert at
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minStock}
                                    onChange={(e) => setMinStock(e.target.value)}
                                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isPending || !name || !price}
                                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                {isPending ? "Adding..." : "Add Product"}
                            </button>
                        </form>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
