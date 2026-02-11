"use client";

import { useOptimistic, useTransition } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";
import { adjustStock } from "@/actions/inventory";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StockAdjusterProps {
    productId: string;
    currentStock: number;
    minStock: number;
}

export function StockAdjuster({
    productId,
    currentStock,
    minStock,
}: StockAdjusterProps) {
    const [optimisticStock, setOptimisticStock] = useOptimistic(currentStock);
    const [isPending, startTransition] = useTransition();

    const handleAdjust = (delta: number) => {
        const newStock = Math.max(0, optimisticStock + delta);
        startTransition(async () => {
            setOptimisticStock(newStock);
            const [, error] = await adjustStock({ id: productId, delta });
            if (error) {
                toast.error("Failed to update stock");
            }
        });
    };

    const isLow = optimisticStock <= minStock;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleAdjust(-1)}
                disabled={isPending || optimisticStock <= 0}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 transition-all active:scale-95 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Minus className="h-4 w-4" />
            </button>

            <div
                className={cn(
                    "flex h-11 min-w-[3.5rem] items-center justify-center rounded-xl px-3 font-semibold tabular-nums text-sm transition-colors",
                    isLow
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-slate-800/80 text-slate-200 border border-slate-700"
                )}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    optimisticStock
                )}
            </div>

            <button
                onClick={() => handleAdjust(1)}
                disabled={isPending}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 transition-all active:scale-95 hover:bg-indigo-500/20 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
}
