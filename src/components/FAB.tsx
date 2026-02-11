"use client";

import { Plus } from "lucide-react";

interface FABProps {
    onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 transition-all active:scale-90 hover:shadow-indigo-500/50 hover:scale-105 md:h-auto md:w-auto md:gap-2 md:rounded-xl md:px-5 md:py-3.5"
            aria-label="Add Product"
        >
            <Plus className="h-6 w-6 md:h-5 md:w-5" />
            <span className="sr-only md:not-sr-only md:text-sm md:font-semibold">
                Add Product
            </span>
        </button>
    );
}
