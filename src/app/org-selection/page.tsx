"use client";

import { useState } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Package, Loader2, Store } from "lucide-react";

export default function OrgSelectionPage() {
    const { isLoaded, createOrganization, setActive } = useOrganizationList();
    const router = useRouter();

    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || !createOrganization || !setActive) return;

        setIsLoading(true);
        setError("");

        try {
            const org = await createOrganization({ name });
            // Set the new org as active so the session has orgId
            await setActive({ organization: org.id });
            // Hard redirect to ensure session picks up the new org
            window.location.href = "/";
        } catch (err: unknown) {
            console.error("Org creation failed:", err);
            const clerkError = err as { errors?: { message: string }[] };
            setError(
                clerkError.errors?.[0]?.message || "Failed to create store. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
            <div className="w-full max-w-sm">
                {/* Logo + Welcome */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                        <Package className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        Welcome to Invento
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Create your first store to start managing inventory
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-400">
                                Store Name
                            </label>
                            <div className="relative">
                                <Store className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Downtown Repair Shop"
                                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !isLoaded || !name.trim()}
                            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Store className="h-4 w-4" />
                            )}
                            {isLoading ? "Creating..." : "Create Store"}
                        </button>
                    </form>

                    <p className="mt-4 text-center text-xs text-slate-500">
                        Each store keeps its inventory completely separate.
                        You can create more stores later.
                    </p>
                </div>
            </div>
        </div>
    );
}
