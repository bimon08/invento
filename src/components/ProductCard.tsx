"use client";

import { useState, useRef, useEffect } from "react";
import type { Product } from "@/db/schema";
import { StockAdjuster } from "./StockAdjuster";
import { formatPrice, cn } from "@/lib/utils";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
    const isLowStock = product.stock <= product.minStock;
    const [nameExpanded, setNameExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const nameRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const el = nameRef.current;
        if (el) {
            // Check if text is actually clamped/overflowing
            setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
        }
    }, [product.name]);

    return (
        <div
            onClick={() => onEdit(product)}
            className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-800/60 to-slate-900/80 p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 active:scale-[0.98]",
                isLowStock
                    ? "border-red-500/30 shadow-md shadow-red-500/5"
                    : "border-slate-700/40 hover:border-indigo-500/30"
            )}
        >
            {/* Subtle glow on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.03] opacity-0 transition-opacity group-hover:opacity-100" />

            {/* Top Row: Name + Edit hint */}
            <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                    <h3
                        ref={nameRef}
                        className={cn(
                            "text-sm font-semibold text-white leading-tight",
                            !nameExpanded && "line-clamp-2"
                        )}
                    >
                        {product.name}
                    </h3>
                    {(isOverflowing || nameExpanded) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setNameExpanded(!nameExpanded);
                            }}
                            className="mt-0.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            {nameExpanded ? "show less" : "...more"}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {isLowStock && (
                        <span className="flex items-center gap-1 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Low
                        </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* Price */}
            <div className="mb-3">
                <p className="text-xl font-bold text-white tabular-nums tracking-tight">
                    {formatPrice(product.price)}
                </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-700/40 mb-3" />

            {/* Stock Adjuster */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between"
            >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
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
