"use client";

import { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Package, Loader2, KeyRound, ArrowRight } from "lucide-react";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

export default function SignInPage() {
    const { isLoaded: signInLoaded, signIn } = useSignIn();
    const { isSignedIn } = useAuth();
    const router = useRouter();

    const [showStaffInput, setShowStaffInput] = useState(false);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isSignedIn) router.replace("/");
    }, [isSignedIn, router]);

    if (isSignedIn) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    const handleGoogleSignIn = () => {
        if (!signInLoaded || !signIn) return;
        signIn.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: "/sign-in/sso-callback",
            redirectUrlComplete: "/",
        });
    };

    const handleCodeChange = (val: string) => {
        setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
        setError("");
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return;

        setIsLoading(true);
        setError("");

        try {
            // Validate code first
            const res = await fetch(`/api/staff?code=${code}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Invalid code");
                return;
            }

            // Code valid — redirect to staff login page
            router.push(`/staff-login/${code}`);
        } catch {
            setError("Failed to connect. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8 overflow-y-auto">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                        <Package className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Invento</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Inventory management for repair shops
                    </p>
                </div>

                {/* Main Card */}
                <div className="rounded-3xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    {/* Google Sign In */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={!signInLoaded || !signIn}
                        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 text-sm font-medium text-white transition-all hover:border-slate-600 hover:bg-slate-700 active:scale-[0.98] disabled:opacity-50"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-800" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">or</span>
                        <div className="h-px flex-1 bg-slate-800" />
                    </div>

                    {/* Staff: Enter Code */}
                    {!showStaffInput ? (
                        <button
                            type="button"
                            onClick={() => setShowStaffInput(true)}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-400 transition-all hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/5"
                        >
                            <KeyRound className="h-4 w-4" />
                            Join as Staff
                        </button>
                    ) : (
                        <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3">
                            <p className="text-xs text-slate-400 text-center">
                                Enter the code your admin shared
                            </p>

                            {error && (
                                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">{error}</p>
                            )}

                            <input
                                type="text"
                                value={code}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                placeholder="ABC123"
                                maxLength={6}
                                autoFocus
                                inputMode="text"
                                autoComplete="off"
                                autoCapitalize="characters"
                                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-center text-lg font-bold tracking-[0.3em] text-white placeholder:text-slate-600 placeholder:tracking-[0.3em] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={code.length < 6 || isLoading}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-40"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setShowStaffInput(false); setError(""); setCode(""); }}
                                className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-[11px] text-slate-600">
                    Manage inventory across your repair shops
                </p>

                <PWAInstallBanner />
            </div>
        </div>
    );
}
