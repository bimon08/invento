"use client";

import type { Product } from "@/db/schema";
import { StockAdjuster } from "./StockAdjuster";
import { formatPrice, cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
    const isLowStock = product.stock <= product.minStock;

    return (
        <div
            onClick={() => onEdit(product)}
            className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-4 transition-all hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]",
                isLowStock
                    ? "border-red-500/40 shadow-red-500/5"
                    : "border-slate-700/50 hover:border-slate-600/50"
            )}
        >
            {/* Low Stock Warning */}
            {isLowStock && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2 py-1 text-xs font-medium text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    Low
                </div>
            )}

            {/* Product Name */}
            <h3 className="mb-1 text-base font-semibold text-white pr-16 leading-tight line-clamp-2">
                {product.name}
            </h3>



            {/* Price */}
            <div className="mb-4">
                <p className="text-2xl font-bold text-white tabular-nums">
                    {formatPrice(product.price)}
                </p>
            </div>

            {/* Stock Adjuster */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between"
            >
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stock
                </span>
                <StockAdjuster
                    productId={product.id}
                    currentStock={product.stock}
                    minStock={product.minStock}
                />
            </div>
        </div>
    );
}
