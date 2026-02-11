import Link from "next/link";
import { Package } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/80 border border-slate-700/50">
                <Package className="h-10 w-10 text-slate-600" />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-white">404</h1>
            <p className="mb-6 text-base text-slate-400">
                This page doesn&apos;t exist.
            </p>
            <Link
                href="/"
                className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-95"
            >
                Go Home
            </Link>
        </div>
    );
}
