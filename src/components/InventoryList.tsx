"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/db/schema";
import { ProductCard } from "./ProductCard";
import { EditProductDrawer } from "./EditProductDrawer";
import { AddProductDrawer } from "./AddProductDrawer";
import { FAB } from "./FAB";
import {
    Package,
    AlertTriangle,
    ChevronRight,
    Tag,
    Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryListProps {
    products: Product[];
}

interface CategoryGroup {
    name: string;
    products: Product[];
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
}

export function InventoryList({ products }: InventoryListProps) {
    const [addDrawerOpen, setAddDrawerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(
        null
    );

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setEditDrawerOpen(true);
    };

    // Group products by category
    const categories = useMemo(() => {
        const groups: Record<string, Product[]> = {};
        products.forEach((p) => {
            const cat = p.category?.trim() || "Uncategorized";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });

        return Object.entries(groups)
            .map(([name, prods]): CategoryGroup => ({
                name,
                products: prods,
                totalStock: prods.reduce((sum, p) => sum + p.stock, 0),
                totalValue: prods.reduce(
                    (sum, p) => sum + p.price * p.stock,
                    0
                ),
                lowStockCount: prods.filter((p) => p.stock <= p.minStock)
                    .length,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products]);

    const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

    const toggleCategory = (categoryName: string) => {
        setExpandedCategory(
            expandedCategory === categoryName ? null : categoryName
        );
    };

    return (
        <>
            {/* Stats Bar */}
            <div className="border-b border-slate-800/50 bg-slate-900/50 px-4 py-3">
                <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto text-sm">
                    <div className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5">
                        <Layers className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-slate-400">Categories</span>
                        <span className="font-semibold text-white">
                            {categories.length}
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5">
                        <Package className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-slate-400">Products</span>
                        <span className="font-semibold text-white">
                            {products.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Category List / Empty State */}
            <div className="mx-auto max-w-7xl px-4 py-6">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/80 border border-slate-700/50">
                            <Package className="h-10 w-10 text-slate-600" />
                        </div>
                        <h2 className="mb-2 text-xl font-semibold text-white">
                            No products yet
                        </h2>
                        <p className="mb-6 max-w-sm text-sm text-slate-400">
                            Start building your inventory by adding your first
                            product. Tap the button below to get started.
                        </p>
                        <button
                            onClick={() => setAddDrawerOpen(true)}
                            className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-95 hover:shadow-indigo-500/40"
                        >
                            <Package className="h-4 w-4" />
                            Add First Product
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {categories.map((cat) => {
                            const isExpanded =
                                expandedCategory === cat.name;

                            return (
                                <div key={cat.name}>
                                    {/* Category Card */}
                                    <button
                                        onClick={() =>
                                            toggleCategory(cat.name)
                                        }
                                        className={cn(
                                            "w-full rounded-2xl border bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-4 text-left transition-all active:scale-[0.99]",
                                            isExpanded
                                                ? "border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                                                : "border-slate-700/50 hover:border-slate-600/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Icon */}
                                            <div
                                                className={cn(
                                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                                                    cat.name ===
                                                        "Uncategorized"
                                                        ? "bg-slate-700/50"
                                                        : "bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20"
                                                )}
                                            >
                                                <Tag
                                                    className={cn(
                                                        "h-5 w-5",
                                                        cat.name ===
                                                            "Uncategorized"
                                                            ? "text-slate-500"
                                                            : "text-indigo-400"
                                                    )}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-semibold text-white truncate">
                                                        {cat.name}
                                                    </h3>
                                                    {cat.lowStockCount >
                                                        0 && (
                                                            <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
                                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                                {cat.lowStockCount}
                                                            </span>
                                                        )}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                                                    <span>
                                                        {cat.products.length}{" "}
                                                        {cat.products
                                                            .length === 1
                                                            ? "product"
                                                            : "products"}
                                                    </span>
                                                    <span className="text-slate-600">
                                                        •
                                                    </span>
                                                    <span>
                                                        {cat.totalStock} in
                                                        stock
                                                    </span>
                                                    <span className="text-slate-600">
                                                        •
                                                    </span>
                                                    <span className="text-emerald-400">
                                                        ₹
                                                        {cat.totalValue.toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Chevron */}
                                            <ChevronRight
                                                className={cn(
                                                    "h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200",
                                                    isExpanded && "rotate-90"
                                                )}
                                            />
                                        </div>
                                    </button>

                                    {/* Expanded Products */}
                                    {isExpanded && (
                                        <div className="mt-2 ml-3 border-l-2 border-indigo-500/20 pl-4 pb-2">
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {cat.products.map(
                                                    (product) => (
                                                        <ProductCard
                                                            key={product.id}
                                                            product={product}
                                                            onEdit={
                                                                handleEdit
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FAB */}
            {products.length > 0 && (
                <FAB onClick={() => setAddDrawerOpen(true)} />
            )}

            {/* Drawers */}
            <AddProductDrawer
                open={addDrawerOpen}
                onOpenChange={setAddDrawerOpen}
            />
            <EditProductDrawer
                product={editingProduct}
                open={editDrawerOpen}
                onOpenChange={setEditDrawerOpen}
            />
        </>
    );
}
