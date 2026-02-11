"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Drawer } from "vaul";
import { createProduct } from "@/actions/inventory";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { CategorySelect } from "./CategorySelect";
import { BrandSelect } from "./BrandSelect";

interface AddProductDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddProductDrawer({ open, onOpenChange }: AddProductDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [minStock, setMinStock] = useState("5");
    const scrollRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const resetForm = () => {
        setName("");
        setBrand("");
        setModel("");
        setCategory("");
        setPrice("");
        setStock("");
        setMinStock("5");
    };

    // Scroll focused input into view when virtual keyboard opens
    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        // Small delay to wait for keyboard to appear
        setTimeout(() => {
            e.target.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 300);
    }, []);

    // Handle visualViewport resize (keyboard open/close)
    useEffect(() => {
        if (!open) return;

        const vv = window.visualViewport;
        if (!vv) return;

        const onResize = () => {
            if (scrollRef.current) {
                // Adjust drawer height based on available visual viewport
                const keyboardHeight = window.innerHeight - vv.height;
                scrollRef.current.style.maxHeight = `calc(85dvh - ${keyboardHeight}px)`;
            }
        };

        vv.addEventListener("resize", onResize);
        return () => vv.removeEventListener("resize", onResize);
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const [, error] = await createProduct({
                name,
                brand,
                model,
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
                <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-t border-slate-700/50 bg-slate-900 max-h-[90dvh]">
                    {/* Drag handle */}
                    <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-slate-700" />

                    {/* Scrollable content */}
                    <div
                        ref={scrollRef}
                        className="overflow-y-auto overscroll-contain px-6 pb-8 pt-4 transition-[max-height] duration-200"
                        style={{ maxHeight: "85dvh" }}
                    >
                        <Drawer.Title className="mb-5 text-xl font-bold text-white">
                            Add Product
                        </Drawer.Title>

                        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                                    onFocus={handleFocus}
                                    placeholder="e.g. iPhone 15 Screen"
                                    enterKeyHint="next"
                                    autoComplete="off"
                                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            {/* Brand & Category Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                        Brand
                                    </label>
                                    <BrandSelect
                                        value={brand}
                                        onChange={setBrand}
                                    />
                                </div>
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

                            {/* Model */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                    Model
                                </label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    onFocus={handleFocus}
                                    placeholder="e.g. iPhone 15 Pro Max"
                                    enterKeyHint="next"
                                    autoComplete="off"
                                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            {/* Price & Stock Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        onFocus={handleFocus}
                                        placeholder="0.00"
                                        inputMode="decimal"
                                        enterKeyHint="next"
                                        className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                        Stock *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        onFocus={handleFocus}
                                        placeholder="0"
                                        inputMode="numeric"
                                        enterKeyHint="next"
                                        className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Min Stock */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                                    Low Stock Alert at
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minStock}
                                    onChange={(e) => setMinStock(e.target.value)}
                                    onFocus={handleFocus}
                                    inputMode="numeric"
                                    enterKeyHint="done"
                                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isPending || !name || !price}
                                className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
