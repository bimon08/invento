"use client";

import { useState, useOptimistic, useTransition, useRef, useEffect } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";
import { adjustStock, updateProduct } from "@/actions/inventory";
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
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus the input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

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

    const handleEditStart = () => {
        setEditValue(String(optimisticStock));
        setIsEditing(true);
    };

    const handleEditSubmit = () => {
        setIsEditing(false);
        const newStock = parseInt(editValue);
        if (isNaN(newStock) || newStock < 0 || newStock === optimisticStock) return;

        const delta = newStock - optimisticStock;
        startTransition(async () => {
            setOptimisticStock(newStock);
            const [, error] = await updateProduct({ id: productId, stock: newStock });
            if (error) {
                toast.error("Failed to update stock");
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleEditSubmit();
        } else if (e.key === "Escape") {
            setIsEditing(false);
        }
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

            {isEditing ? (
                <input
                    ref={inputRef}
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleEditSubmit}
                    onKeyDown={handleKeyDown}
                    inputMode="numeric"
                    className={cn(
                        "h-11 w-16 rounded-xl border px-2 text-center font-semibold tabular-nums text-sm outline-none transition-all",
                        isLow
                            ? "bg-red-500/15 text-red-400 border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                            : "bg-slate-800 text-white border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    )}
                />
            ) : (
                <button
                    onClick={handleEditStart}
                    disabled={isPending}
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
                </button>
            )}

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
