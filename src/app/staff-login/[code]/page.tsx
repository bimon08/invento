"use client";

import { useState, useEffect, use } from "react";
import { Package, Loader2, Store, User, UserPlus, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { broadcastLogin } from "@/lib/auth-sync";

interface StaffMember {
    id: string;
    username: string;
}

export default function StaffSelectPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);

    const [orgName, setOrgName] = useState("");
    const [members, setMembers] = useState<StaffMember[]>([]);
    const [newUsername, setNewUsername] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    // Fetch members on mount
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/staff?code=${code}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Invalid code");
                    return;
                }

                setOrgName(data.orgName);
                setMembers(data.members);
            } catch {
                setError("Failed to load. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [code]);

    const handleSelectMember = async (staffId: string) => {
        setIsJoining(true);
        setJoiningId(staffId);
        setError("");

        try {
            const res = await fetch("/api/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, staffId }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to login");
                setIsJoining(false);
                setJoiningId(null);
                return;
            }

            setDone(true);
            broadcastLogin();
            setTimeout(() => { window.location.href = "/"; }, 1000);
        } catch {
            setError("Something went wrong");
            setIsJoining(false);
            setJoiningId(null);
        }
    };

    const handleCreateUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim() || newUsername.trim().length < 2) {
            setError("Name must be at least 2 characters");
            return;
        }

        setIsJoining(true);
        setError("");

        try {
            const res = await fetch("/api/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, username: newUsername.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to create");
                setIsJoining(false);
                return;
            }

            setDone(true);
            broadcastLogin();
            setTimeout(() => { window.location.href = "/"; }, 1000);
        } catch {
            setError("Something went wrong");
            setIsJoining(false);
        }
    };

    // Loading
    if (isLoading) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30">
                            <Package className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                        <p className="text-sm font-medium text-slate-400">Loading store...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error loading (invalid code)
    if (error && !orgName) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl" />
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30">
                                <Package className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Invento</h1>
                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-slate-900/80 p-8 text-center backdrop-blur-sm">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                        </div>
                        <h2 className="mb-2 text-lg font-bold text-white">Invalid Code</h2>
                        <p className="mb-6 text-sm text-slate-400">{error}</p>
                        <a
                            href="/sign-in"
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-5 text-sm font-medium text-white transition-all hover:bg-slate-700 active:scale-95"
                        >
                            ← Back to Sign In
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8 overflow-y-auto">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30">
                            <Package className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Invento</h1>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-2xl shadow-black/30 backdrop-blur-sm overflow-hidden">
                    {done ? (
                        /* ── Success ─────────────────────────────────────── */
                        <div className="flex flex-col items-center gap-4 p-8 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Welcome back!</h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Logging into <span className="text-white font-medium">{orgName}</span>
                                </p>
                            </div>
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                        </div>
                    ) : (
                        /* ── Staff Selection ────────────────────────────── */
                        <>
                            {/* Store header with accent bar */}
                            <div className="relative border-b border-slate-800 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 px-6 py-5">
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-600" />
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
                                        {(orgName?.[0] || "?").toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{orgName}</h2>
                                        <p className="text-xs text-slate-400">Select your name to continue</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-400">
                                        {error}
                                    </div>
                                )}

                                {/* Existing members */}
                                {members.length > 0 && (
                                    <div className="mb-5">
                                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Team members
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {members.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => handleSelectMember(m.id)}
                                                    disabled={isJoining}
                                                    className="group flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3.5 text-left transition-all hover:border-indigo-500/30 hover:bg-slate-800/80 active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/20">
                                                            <span className="text-sm font-bold text-indigo-300">
                                                                {m.username[0]?.toUpperCase() || "?"}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-200 truncate">
                                                            {m.username}
                                                        </span>
                                                    </div>
                                                    {joiningId === m.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
                                                    ) : (
                                                        <ArrowRight className="h-4 w-4 text-slate-600 transition-all group-hover:text-indigo-400 group-hover:translate-x-0.5 shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                        {members.length > 0 ? "or new here?" : "Get started"}
                                    </span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                </div>

                                {/* Create new */}
                                <form onSubmit={handleCreateUsername} className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => { setNewUsername(e.target.value); setError(""); }}
                                        placeholder="Enter your name"
                                        autoComplete="off"
                                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newUsername.trim() || isJoining}
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] hover:shadow-indigo-500/40 disabled:opacity-40"
                                    >
                                        {isJoining && !joiningId ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4" />
                                                Join as new member
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>

                {/* Back link */}
                {!done && (
                    <div className="mt-6 text-center">
                        <a href="/sign-in" className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
                            ← Back to Sign In
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
