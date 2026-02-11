"use client";

import { useState, useEffect, use } from "react";
import { useAuth, useOrganizationList } from "@clerk/nextjs";
import { Package, Loader2, Store, UserPlus, AlertCircle } from "lucide-react";

interface JoinCodeInfo {
    orgId: string;
    orgName: string;
    role: string;
    code: string;
}

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { setActive } = useOrganizationList();

    const [codeInfo, setCodeInfo] = useState<JoinCodeInfo | null>(null);
    const [error, setError] = useState("");
    const [isValidating, setIsValidating] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [joined, setJoined] = useState(false);

    // Validate the code on mount
    useEffect(() => {
        async function validate() {
            try {
                const res = await fetch(`/api/join-codes/validate?code=${code}`);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || "Invalid invite code");
                } else {
                    setCodeInfo(data);
                }
            } catch {
                setError("Failed to validate invite code");
            } finally {
                setIsValidating(false);
            }
        }
        validate();
    }, [code]);

    const handleJoin = async () => {
        if (!isSignedIn) {
            // Redirect to sign-in with return URL
            window.location.href = `/sign-in?redirect_url=${encodeURIComponent(`/join/${code}`)}`;
            return;
        }

        setIsJoining(true);
        setError("");

        try {
            const res = await fetch("/api/join-codes/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to join store");
                return;
            }

            setJoined(true);

            // Set the org as active and redirect
            if (setActive) {
                await setActive({ organization: data.orgId });
            }
            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsJoining(false);
        }
    };

    // Loading state
    if (isValidating || !authLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className="text-sm text-slate-400">Validating invite...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                        <Package className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Invento</h1>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
                    {error && !codeInfo ? (
                        /* Invalid code */
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                                <AlertCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Invalid Invite</h2>
                                <p className="mt-1 text-sm text-slate-400">{error}</p>
                            </div>
                            <a
                                href="/sign-in"
                                className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Go to Sign In →
                            </a>
                        </div>
                    ) : codeInfo && joined ? (
                        /* Success */
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                                <UserPlus className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">You&apos;re In!</h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    You&apos;ve joined <span className="text-white font-medium">{codeInfo.orgName}</span>
                                </p>
                            </div>
                            <p className="text-xs text-slate-500">Redirecting...</p>
                        </div>
                    ) : codeInfo ? (
                        /* Join prompt */
                        <div className="flex flex-col items-center gap-5 py-2 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                <Store className="h-7 w-7 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Join {codeInfo.orgName}
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    You&apos;ve been invited to join this store as a{" "}
                                    <span className="text-white font-medium">
                                        {codeInfo.role === "org:admin" ? "Admin" : "Member"}
                                    </span>
                                </p>
                            </div>

                            {error && (
                                <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleJoin}
                                disabled={isJoining}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] hover:shadow-indigo-500/40 disabled:opacity-50"
                            >
                                {isJoining ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <UserPlus className="h-4 w-4" />
                                )}
                                {!isSignedIn
                                    ? "Sign In to Join"
                                    : isJoining
                                        ? "Joining..."
                                        : "Join Store"}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
