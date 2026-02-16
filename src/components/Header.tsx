"use client";

import { Package, Store, Sun, Moon, Users, LogOut, Settings, Plus, Loader2, Check, MoreVertical, Pencil, Trash2, ChevronDown, Menu, X, IndianRupee } from "lucide-react";
import { useOrganization, useUser, useClerk, useOrganizationList } from "@clerk/nextjs";
import { useTheme } from "./ThemeProvider";
import { useRouter } from "next/navigation";
import { broadcastLogout } from "@/lib/auth-sync";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
    totalValue?: number;
    staffUsername?: string;
    storeName?: string;
}

export function Header({ totalValue, staffUsername, storeName }: HeaderProps) {
    const { organization, membership } = useOrganization();
    const { user } = useUser();
    const { signOut } = useClerk();
    const { isLoaded, userMemberships, setActive, createOrganization } =
        useOrganizationList({
            userMemberships: { infinite: true },
        });
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const isStaff = !!staffUsername;
    const isAdmin = membership?.role === "org:admin";
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showCreateStore, setShowCreateStore] = useState(false);
    const [newStoreName, setNewStoreName] = useState("");
    const [isCreatingStore, setIsCreatingStore] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [desktopStoreDropdown, setDesktopStoreDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const storeDropdownRef = useRef<HTMLDivElement>(null);

    const displayStoreName = organization?.name || storeName;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const initials = isStaff
        ? (staffUsername?.[0] || "S").toUpperCase()
        : (user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U").toUpperCase();

    const displayName = isStaff
        ? staffUsername
        : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.emailAddresses[0]?.emailAddress;

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value.toLocaleString("en-IN")}`;
    };

    const handleSignOut = async () => {
        broadcastLogout();
        if (isStaff) {
            await fetch("/api/staff", { method: "DELETE" });
            window.location.href = "/sign-in";
        } else {
            signOut(() => router.push("/sign-in"));
        }
    };

    const handleSwitchStore = async (orgId: string) => {
        if (!setActive) return;
        await setActive({ organization: orgId });
        router.refresh();
    };

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createOrganization || !setActive || !newStoreName.trim()) return;

        setIsCreatingStore(true);
        try {
            const org = await createOrganization({ name: newStoreName.trim() });
            await setActive({ organization: org.id });
            await userMemberships?.revalidate?.();
            setNewStoreName("");
            setShowCreateStore(false);
            toast.success("Store created", {
                description: `${org.name} is now your active store.`,
            });
            router.refresh();
        } catch {
            toast.error("Failed to create store");
        } finally {
            setIsCreatingStore(false);
        }
    };

    const handleDeleteStore = async (orgId: string, orgName: string) => {
        if (
            !confirm(
                `Delete "${orgName}"? All inventory data for this store will be lost. This cannot be undone.`
            )
        )
            return;

        setDeletingId(orgId);
        try {
            if (organization?.id === orgId) {
                const other = userMemberships?.data?.find(
                    (m) => m.organization.id !== orgId
                );
                if (other && setActive) {
                    await setActive({ organization: other.organization.id });
                }
            }
            const orgToDelete = userMemberships?.data?.find(
                (m) => m.organization.id === orgId
            );
            if (orgToDelete) {
                await orgToDelete.organization.destroy();
                toast.success(`"${orgName}" deleted`);
                userMemberships?.revalidate?.();
                router.refresh();
            }
        } catch {
            toast.error("Failed to delete store");
        } finally {
            setDeletingId(null);
        }
    };

    const handleRenameStore = async (orgId: string) => {
        if (!renameValue.trim()) {
            setRenamingId(null);
            return;
        }
        try {
            const mem = userMemberships?.data?.find(
                (m) => m.organization.id === orgId
            );
            if (mem) {
                await mem.organization.update({ name: renameValue.trim() });
                toast.success("Store renamed");
                userMemberships?.revalidate?.();
                router.refresh();
            }
        } catch {
            toast.error("Failed to rename store");
        } finally {
            setRenamingId(null);
        }
    };

    const UserAvatar = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
        const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
        const text = size === "sm" ? "text-[11px]" : "text-xs";
        return !isStaff && user?.imageUrl ? (
            <img
                src={user.imageUrl}
                alt={user.firstName || "User"}
                className={`${dim} rounded-full object-cover ring-2 ring-slate-700/50`}
            />
        ) : (
            <div className={`flex ${dim} items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 ${text} font-bold text-white ring-2 ring-indigo-500/20`}>
                {initials}
            </div>
        );
    };

    // Store switcher dropdown content (shared between desktop and mobile)
    const StoreList = ({ onSwitch }: { onSwitch?: () => void }) => (
        <>
            <div className="max-h-52 overflow-y-auto p-1.5">
                {userMemberships?.data?.map((mem) => (
                    <div
                        key={mem.organization.id}
                        className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-800/80"
                    >
                        <button
                            onClick={() => {
                                handleSwitchStore(mem.organization.id);
                                onSwitch?.();
                            }}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white shadow-sm"
                        >
                            {(mem.organization.name?.[0] || "?").toUpperCase()}
                        </button>

                        {renamingId === mem.organization.id ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleRenameStore(mem.organization.id);
                                }}
                                className="flex-1 min-w-0"
                            >
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={() => handleRenameStore(mem.organization.id)}
                                    className="h-8 w-full rounded-lg border border-indigo-500 bg-slate-800 px-3 text-sm text-white outline-none"
                                    autoFocus
                                />
                            </form>
                        ) : (
                            <button
                                onClick={() => {
                                    handleSwitchStore(mem.organization.id);
                                    onSwitch?.();
                                }}
                                className="flex-1 min-w-0 text-left"
                            >
                                <p className="truncate text-sm font-medium text-slate-200">
                                    {mem.organization.name}
                                </p>
                            </button>
                        )}

                        {organization?.id === mem.organization.id && (
                            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        )}

                        {isAdmin && (
                            <div className="relative shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(
                                            menuOpenId === mem.organization.id
                                                ? null
                                                : mem.organization.id
                                        );
                                    }}
                                    className="rounded-lg p-1.5 text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-700 hover:text-slate-300"
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </button>

                                {menuOpenId === mem.organization.id && (
                                    <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800 shadow-xl shadow-black/30">
                                        <button
                                            onClick={() => {
                                                setMenuOpenId(null);
                                                setRenamingId(mem.organization.id);
                                                setRenameValue(mem.organization.name || "");
                                            }}
                                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                                        >
                                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                            Rename
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMenuOpenId(null);
                                                handleDeleteStore(
                                                    mem.organization.id,
                                                    mem.organization.name
                                                );
                                            }}
                                            disabled={deletingId === mem.organization.id}
                                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                                        >
                                            {deletingId === mem.organization.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Create new store */}
            {isAdmin && (
                <div className="border-t border-slate-800 p-1.5">
                    {!showCreateStore ? (
                        <button
                            onClick={() => setShowCreateStore(true)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/10"
                        >
                            <Plus className="h-4 w-4" />
                            Create new store
                        </button>
                    ) : (
                        <form onSubmit={handleCreateStore} className="flex gap-2 px-2 py-1.5">
                            <input
                                type="text"
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                placeholder="Store name"
                                className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isCreatingStore || !newStoreName.trim()}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
                            >
                                {isCreatingStore ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </>
    );

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                    ? "border-b border-indigo-500/10 bg-slate-950/90 shadow-lg shadow-black/20 backdrop-blur-xl"
                    : "border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-lg"
                }`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
                {/* ── Left: Logo + Store ── */}
                <Link href="/" className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                        <Package className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                            Invento
                        </h1>
                        {displayStoreName && (
                            <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate leading-tight">
                                <Store className="h-3 w-3 shrink-0 text-emerald-400" />
                                {displayStoreName}
                            </p>
                        )}
                    </div>
                </Link>

                {/* ── Center: Total Value (admin only, desktop) ── */}
                {!isStaff && isAdmin && totalValue !== undefined && totalValue > 0 && (
                    <div className="hidden lg:flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
                            <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/70">
                                Store Total
                            </p>
                            <p className="text-sm font-bold text-emerald-400 leading-tight">
                                {formatCurrency(totalValue)}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Right: Desktop actions ── */}
                <div className="hidden lg:flex items-center gap-2.5">
                    {/* User info */}
                    <div className="flex items-center gap-2.5 mr-1">
                        <UserAvatar />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white leading-tight truncate max-w-[140px]">
                                {displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                {isStaff ? "Staff" : isAdmin ? "Admin" : "Member"}
                            </p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700/50" />

                    {/* Store Switcher Dropdown — admin only */}
                    {!isStaff && isAdmin && isLoaded && userMemberships?.data && (
                        <div className="relative" ref={storeDropdownRef}>
                            <button
                                onClick={() => setDesktopStoreDropdown(!desktopStoreDropdown)}
                                className="flex h-9 items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                            >
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-emerald-500 to-teal-600 text-[9px] font-bold text-white">
                                    {(organization?.name?.[0] || "?").toUpperCase()}
                                </div>
                                <span className="max-w-[100px] truncate">
                                    {organization?.name || "Select store"}
                                </span>
                                <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${desktopStoreDropdown ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                                {desktopStoreDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => {
                                                setDesktopStoreDropdown(false);
                                                setMenuOpenId(null);
                                                setShowCreateStore(false);
                                            }}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl shadow-black/40"
                                        >
                                            <div className="border-b border-slate-800 px-4 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                                    Your Stores
                                                </p>
                                            </div>
                                            <StoreList onSwitch={() => setDesktopStoreDropdown(false)} />
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Admin links */}
                    {!isStaff && isAdmin && (
                        <>
                            <Link
                                href="/staff"
                                className="flex h-9 items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                            >
                                <Users className="h-3.5 w-3.5" />
                                Staff
                            </Link>
                            <Link
                                href="/settings"
                                className="flex h-9 items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                            >
                                <Settings className="h-3.5 w-3.5" />
                                Settings
                            </Link>
                        </>
                    )}

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    {/* Sign out */}
                    <button
                        onClick={handleSignOut}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/20"
                        aria-label="Sign out"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* ── Right: Mobile hamburger ── */}
                <div className="flex lg:hidden items-center gap-2">
                    {/* Store total badge for mobile (admin only) */}
                    {!isStaff && isAdmin && totalValue !== undefined && totalValue > 0 && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5">
                            <IndianRupee className="h-3 w-3 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">
                                {formatCurrency(totalValue)}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 text-slate-300 transition-all hover:text-white"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* ── Mobile Menu ── */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                            style={{ top: "64px" }}
                        />
                        {/* Menu panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute inset-x-0 top-full z-50 mx-3 mt-2 flex flex-col gap-3 rounded-2xl border border-slate-700/50 bg-slate-900 px-5 py-5 shadow-2xl shadow-black/40 lg:hidden"
                        >
                            {/* User info */}
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                                <UserAvatar size="lg" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                    <p className="text-[11px] text-slate-400">
                                        {isStaff ? "Staff" : isAdmin ? "Admin" : "Member"}
                                    </p>
                                </div>
                            </div>

                            {/* Store Section — staff only */}
                            {isStaff && displayStoreName && (
                                <div className="flex items-center gap-2.5 rounded-xl bg-slate-800/50 px-3 py-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                                        {displayStoreName[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{displayStoreName}</p>
                                        <p className="text-[10px] text-slate-500">Staff member</p>
                                    </div>
                                </div>
                            )}

                            {/* Admin: Store list with management */}
                            {!isStaff && isLoaded && userMemberships?.data && userMemberships.data.length > 0 && (
                                <div className="border-b border-slate-800 pb-3">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Your Stores
                                    </p>
                                    <StoreList onSwitch={() => setIsMobileMenuOpen(false)} />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                                >
                                    {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
                                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                </button>

                                {!isStaff && isAdmin && (
                                    <>
                                        <Link
                                            href="/staff"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                                        >
                                            <Users className="h-4 w-4 text-slate-500" />
                                            Staff
                                        </Link>
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                                        >
                                            <Settings className="h-4 w-4 text-slate-500" />
                                            Settings
                                        </Link>
                                    </>
                                )}

                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
