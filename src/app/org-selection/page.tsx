"use client";

import { useState, useEffect } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { Package, Loader2, Store, Plus, ChevronRight } from "lucide-react";

export default function OrgSelectionPage() {
    const {
        isLoaded,
        userMemberships,
        createOrganization,
        setActive,
    } = useOrganizationList({
        userMemberships: { infinite: true },
    });

    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);

    const memberships = userMemberships?.data ?? [];

    // Auto-select if user has exactly one org (invited member)
    useEffect(() => {
        if (!isLoaded || !setActive) return;
        if (memberships.length === 1 && !selectingId) {
            const orgId = memberships[0].organization.id;
            setSelectingId(orgId);
            setActive({ organization: orgId }).then(() => {
                window.location.href = "/";
            });
        }
    }, [isLoaded, memberships, setActive, selectingId]);

    const handleSelectOrg = async (orgId: string) => {
        if (!setActive) return;
        setSelectingId(orgId);
        setError("");
        try {
            await setActive({ organization: orgId });
            window.location.href = "/";
        } catch {
            setError("Failed to select store. Please try again.");
            setSelectingId(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || !createOrganization || !setActive) return;

        setIsLoading(true);
        setError("");

        try {
            const org = await createOrganization({ name });
            await setActive({ organization: org.id });
            window.location.href = "/";
        } catch (err: unknown) {
            console.error("Org creation failed:", err);
            const clerkError = err as { errors?: { message: string }[] };
            setError(
                clerkError.errors?.[0]?.message ||
                "Failed to create store. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while auto-selecting
    if (!isLoaded || (memberships.length === 1 && selectingId)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className="text-sm text-slate-400">Loading your stores...</p>
                </div>
            </div>
        );
    }

    const hasOrgs = memberships.length > 0;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
            <div className="w-full max-w-sm">
                {/* Logo + Welcome */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                        <Package className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        {hasOrgs ? "Select a Store" : "Welcome to Invento"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {hasOrgs
                            ? "Choose a store to continue"
                            : "Create your first store to start managing inventory"}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Existing Stores */}
                {hasOrgs && !showCreateForm && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 shadow-xl shadow-black/20 backdrop-blur-sm">
                        <div className="flex flex-col gap-2">
                            {memberships.map(({ organization }) => (
                                <button
                                    key={organization.id}
                                    onClick={() =>
                                        handleSelectOrg(organization.id)
                                    }
                                    disabled={!!selectingId}
                                    className="flex h-14 w-full items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 text-left transition-all hover:border-indigo-500/50 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                                        <Store className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <span className="flex-1 text-sm font-medium text-white truncate">
                                        {organization.name}
                                    </span>
                                    {selectingId === organization.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 text-xs font-medium text-slate-500 transition-all hover:border-slate-600 hover:text-slate-400"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Create New Store
                        </button>
                    </div>
                )}

                {/* Create Store Form */}
                {(!hasOrgs || showCreateForm) && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
                        {showCreateForm && (
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="mb-4 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                ← Back to stores
                            </button>
                        )}

                        <form
                            onSubmit={handleCreate}
                            className="flex flex-col gap-4"
                        >
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
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="e.g. Downtown Repair Shop"
                                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    isLoading || !isLoaded || !name.trim()
                                }
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
                )}
            </div>
        </div>
    );
}
