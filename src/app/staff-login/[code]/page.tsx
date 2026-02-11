"use client";

import { useState, useEffect, use } from "react";
import { Package, Loader2, Store, User, UserPlus } from "lucide-react";

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
                return;
            }

            setDone(true);
            setTimeout(() => { window.location.href = "/"; }, 1000);
        } catch {
            setError("Something went wrong");
            setIsJoining(false);
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
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className="text-sm text-slate-400">Loading store...</p>
                </div>
            </div>
        );
    }

    // Error loading (invalid code)
    if (error && !orgName) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
                <div className="w-full max-w-sm text-center">
                    <div className="mb-6 flex flex-col items-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                            <Package className="h-7 w-7 text-white" />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6">
                        <p className="text-red-400 mb-4">{error}</p>
                        <a
                            href="/sign-in"
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
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
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                        <Package className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Invento</h1>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
                    {done ? (
                        /* Success */
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                                <Store className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">You&apos;re In!</h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Welcome to <span className="text-white font-medium">{orgName}</span>
                                </p>
                            </div>
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                        </div>
                    ) : (
                        /* Staff Selection */
                        <div className="flex flex-col gap-5">
                            {/* Header */}
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <Store className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{orgName}</h2>
                                    <p className="text-xs text-slate-400">Who are you?</p>
                                </div>
                            </div>

                            {error && (
                                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">{error}</p>
                            )}

                            {/* Existing members */}
                            {members.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tap your name</p>
                                    <div className="flex flex-col gap-1.5">
                                        {members.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => handleSelectMember(m.id)}
                                                disabled={isJoining}
                                                className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3.5 text-left text-sm font-medium text-white transition-all hover:border-indigo-500/40 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 shrink-0">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <span className="truncate">{m.username}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-800" />
                                <span className="text-[10px] text-slate-500">
                                    {members.length > 0 ? "or add yourself" : "add yourself"}
                                </span>
                                <div className="h-px flex-1 bg-slate-800" />
                            </div>

                            {/* Create new */}
                            <form onSubmit={handleCreateUsername} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => { setNewUsername(e.target.value); setError(""); }}
                                    placeholder="Enter your name"
                                    autoComplete="off"
                                    className="h-12 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newUsername.trim() || isJoining}
                                    className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
                                >
                                    {isJoining ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="h-4 w-4" />
                                            Join
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Back link */}
                {!done && (
                    <div className="mt-4 text-center">
                        <a href="/sign-in" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                            ← Back to Sign In
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
