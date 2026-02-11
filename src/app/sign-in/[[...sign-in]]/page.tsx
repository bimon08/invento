"use client";

import { useState, useEffect } from "react";
import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Package, Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

export default function SignInPage() {
    const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
    const { isLoaded: signUpLoaded, signUp } = useSignUp();
    const { isSignedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isSignedIn) router.replace("/");
    }, [isSignedIn, router]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);

    // If already signed in, show loading
    if (isSignedIn) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signInLoaded || !signIn) return;

        setIsLoading(true);
        setError("");
        setShowSignUpPrompt(false);

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === "complete" && setActive) {
                await setActive({ session: result.createdSessionId });
                router.push("/");
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: { code: string; message: string }[] };
            const firstError = clerkError.errors?.[0];

            if (firstError?.code === "session_exists") {
                // Already signed in — hard redirect to bypass any caching
                window.location.href = "/";
                return;
            } else if (firstError?.code === "form_identifier_not_found") {
                setShowSignUpPrompt(true);
                setError("Account not found. Would you like to create one?");
            } else {
                setError(firstError?.message || "Invalid email or password");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!signUpLoaded || !signUp) return;
        setIsLoading(true);
        setError("");

        try {
            const result = await signUp.create({
                emailAddress: email,
                password,
            });

            if (result.status === "complete" && setActive) {
                await setActive({ session: result.createdSessionId });
                router.push("/");
            } else {
                setError("Signup requires additional steps. Please contact support.");
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "Failed to create account");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setTimeout(() => {
            e.target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
    };

    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8 overflow-y-auto">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                        <Package className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Invento</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {showSignUpPrompt ? "Create your new account" : "Sign in to your account"}
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    {/* Google Sign In */}
                    {!showSignUpPrompt && (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    if (signInLoaded && signIn) {
                                        signIn.authenticateWithRedirect({
                                            strategy: "oauth_google",
                                            redirectUrl: "/sign-in/sso-callback",
                                            redirectUrlComplete: "/",
                                        });
                                    }
                                }}
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

                            <div className="my-6 flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-800" />
                                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">or</span>
                                <div className="h-px flex-1 bg-slate-800" />
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Error / Prompt */}
                        {error && (
                            <div className={error.includes("create one")
                                ? "rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-4 py-3 text-sm text-indigo-300 ring-1 ring-indigo-500/20"
                                : "rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20"}>
                                {error}
                            </div>
                        )}

                        {!showSignUpPrompt ? (
                            <>
                                {/* Email */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={handleFocus}
                                        placeholder="you@example.com"
                                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                        autoComplete="email"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={handleFocus}
                                            placeholder="••••••••"
                                            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 pr-12 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !signInLoaded}
                                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] hover:shadow-indigo-500/40 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : null}
                                    {isLoading ? "Checking..." : "Sign In"}
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleSignUp}
                                    disabled={isLoading || !signUpLoaded}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] hover:bg-indigo-400"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <UserPlus className="h-4 w-4" />
                                    )}
                                    Yes, Create Account
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSignUpPrompt(false);
                                        setError("");
                                    }}
                                    className="h-11 w-full rounded-xl border border-slate-700 bg-transparent text-xs font-bold text-slate-500 hover:bg-slate-800 transition-colors uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* PWA Install */}
                <PWAInstallBanner />
            </div>
        </div>
    );
}
