"use client";

import {
    Navbar,
    NavBody,
    MobileNav,
    MobileNavHeader,
    MobileNavToggle,
    MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { Package, Store, Sun, Moon, Users, LogOut, Settings, Plus, Loader2, Check, MoreVertical, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useOrganization, useUser, useClerk, useOrganizationList } from "@clerk/nextjs";
import { useTheme } from "./ThemeProvider";
import { useRouter } from "next/navigation";
import { broadcastLogout } from "@/lib/auth-sync";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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

    const displayStoreName = organization?.name || storeName;

    const initials = isStaff
        ? (staffUsername?.[0] || "S").toUpperCase()
        : (user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U").toUpperCase();

    const displayName = isStaff
        ? staffUsername
        : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.emailAddresses[0]?.emailAddress;

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

    const Logo = () => (
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
    );

    const UserAvatar = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
        const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
        const round = size === "sm" ? "rounded-lg" : "rounded-xl";
        return !isStaff && user?.imageUrl ? (
            <img
                src={user.imageUrl}
                alt={user.firstName || "User"}
                className={`${dim} ${round} object-cover`}
            />
        ) : (
            <div className={`flex ${dim} items-center justify-center ${round} bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white`}>
                {initials}
            </div>
        );
    };

    return (
        <Navbar>
            {/* ── Desktop ── */}
            <NavBody>
                <Logo />

                <div className="flex items-center gap-3">
                    {/* User info */}
                    <div className="flex items-center gap-2.5">
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

                    <div className="h-6 w-px bg-slate-700/50 mx-1" />

                    {/* Store Switcher Dropdown — admin only */}
                    {!isStaff && isAdmin && isLoaded && userMemberships?.data && (
                        <div className="relative">
                            <button
                                onClick={() => setDesktopStoreDropdown(!desktopStoreDropdown)}
                                className="flex h-9 items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/80 px-3 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                            >
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-emerald-500 to-teal-600 text-[9px] font-bold text-white">
                                    {(organization?.name?.[0] || "?").toUpperCase()}
                                </div>
                                <span className="max-w-[120px] truncate">
                                    {organization?.name || "Select store"}
                                </span>
                                <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${desktopStoreDropdown ? "rotate-180" : ""}`} />
                            </button>

                            {desktopStoreDropdown && (
                                <>
                                    {/* Invisible backdrop to close dropdown */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => {
                                            setDesktopStoreDropdown(false);
                                            setMenuOpenId(null);
                                            setShowCreateStore(false);
                                        }}
                                    />
                                    <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
                                        {/* Header */}
                                        <div className="border-b border-slate-800 px-4 py-2.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                                Your Stores
                                            </p>
                                        </div>

                                        {/* Store list */}
                                        <div className="max-h-56 overflow-y-auto p-1.5">
                                            {userMemberships.data.map((mem) => (
                                                <div
                                                    key={mem.organization.id}
                                                    className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-800"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            handleSwitchStore(mem.organization.id);
                                                            setDesktopStoreDropdown(false);
                                                        }}
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm"
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
                                                                setDesktopStoreDropdown(false);
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

                                                    {/* Three-dot menu */}
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
                                                </div>
                                            ))}
                                        </div>

                                        {/* Create new store */}
                                        <div className="border-t border-slate-800 p-1.5">
                                            {!showCreateStore ? (
                                                <button
                                                    onClick={() => setShowCreateStore(true)}
                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/10"
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
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Admin links */}
                    {!isStaff && isAdmin && (
                        <>
                            <Link
                                href="/staff"
                                className="flex h-9 items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/80 px-3 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                            >
                                <Users className="h-3.5 w-3.5" />
                                Staff
                            </Link>
                            <Link
                                href="/settings"
                                className="flex h-9 items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/80 px-3 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                            >
                                <Settings className="h-3.5 w-3.5" />
                                Settings
                            </Link>
                        </>
                    )}

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/80 text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    {/* Sign out */}
                    <button
                        onClick={handleSignOut}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/20"
                        aria-label="Sign out"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </button>
                </div>
            </NavBody>

            {/* ── Mobile ── */}
            <MobileNav>
                <MobileNavHeader>
                    <Logo />
                    <MobileNavToggle
                        isOpen={isMobileMenuOpen}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />
                </MobileNavHeader>

                <MobileNavMenu
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                >
                    {/* User info */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                        <UserAvatar size="lg" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                            <p className="text-[11px] text-slate-400">
                                {isStaff ? "Staff" : isAdmin ? "Admin" : "Member"}
                            </p>
                        </div>
                    </div>

                    {/* Store Section */}
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
                            <div className="flex flex-col gap-1">
                                {userMemberships.data.map((mem) => (
                                    <div
                                        key={mem.organization.id}
                                        className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-800/80"
                                    >
                                        <button
                                            onClick={() => handleSwitchStore(mem.organization.id)}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm"
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
                                                onClick={() => handleSwitchStore(mem.organization.id)}
                                                className="flex-1 min-w-0 text-left"
                                            >
                                                <p className="truncate text-sm font-medium text-slate-200">
                                                    {mem.organization.name}
                                                </p>
                                                {organization?.id === mem.organization.id && (
                                                    <p className="text-[10px] font-semibold text-emerald-400">Active store</p>
                                                )}
                                            </button>
                                        )}

                                        {organization?.id === mem.organization.id && (
                                            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                                        )}

                                        {/* Three-dot menu — admin only */}
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
                                                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>

                                                {menuOpenId === mem.organization.id && (
                                                    <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
                                                        <button
                                                            onClick={() => {
                                                                setMenuOpenId(null);
                                                                setRenamingId(mem.organization.id);
                                                                setRenameValue(mem.organization.name || "");
                                                            }}
                                                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
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

                            {/* Create Store — admin only */}
                            {isAdmin && (
                                <div className="mt-2">
                                    {!showCreateStore ? (
                                        <button
                                            onClick={() => setShowCreateStore(true)}
                                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/10"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create new store
                                        </button>
                                    ) : (
                                        <form
                                            onSubmit={handleCreateStore}
                                            className="flex gap-2 px-1 pt-1"
                                        >
                                            <input
                                                type="text"
                                                value={newStoreName}
                                                onChange={(e) => setNewStoreName(e.target.value)}
                                                placeholder="Store name"
                                                className="h-10 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={isCreatingStore || !newStoreName.trim()}
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
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
                </MobileNavMenu>
            </MobileNav>
        </Navbar>
    );
}
