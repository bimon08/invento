"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (navigator as unknown as { standalone?: boolean }).standalone === true;
        setIsStandalone(standalone);

        if (standalone) return;

        // Detect iOS
        const ios =
            /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
            !(window as unknown as { MSStream?: unknown }).MSStream;
        setIsIOS(ios);

        if (ios) {
            // On iOS, always show the manual install instructions
            const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
            if (!dismissed) setShowBanner(true);
            return;
        }

        // On Android/Desktop, listen for the install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        sessionStorage.setItem("pwa-banner-dismissed", "true");
    };

    if (isStandalone || !showBanner) return null;

    return (
        <div className="w-full max-w-sm mx-auto mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="relative rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-purple-600/10 p-4 backdrop-blur-sm">
                <button
                    onClick={handleDismiss}
                    className="absolute right-3 top-3 rounded-lg p-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 pr-4">
                        <h3 className="text-sm font-semibold text-white">
                            Install Invento
                        </h3>
                        {isIOS ? (
                            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                Tap{" "}
                                <Share className="inline h-3 w-3 text-indigo-400" />{" "}
                                <span className="text-indigo-400 font-medium">Share</span>
                                {" "}then{" "}
                                <span className="text-indigo-400 font-medium">
                                    &ldquo;Add to Home Screen&rdquo;
                                </span>
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-slate-400">
                                Get the full app experience on your device
                            </p>
                        )}
                    </div>
                </div>

                {!isIOS && deferredPrompt && (
                    <button
                        onClick={handleInstall}
                        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] hover:shadow-indigo-500/40"
                    >
                        <Download className="h-4 w-4" />
                        Install App
                    </button>
                )}
            </div>
        </div>
    );
}
