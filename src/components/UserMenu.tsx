"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    useUser,
    useClerk,
    useOrganization,
    useOrganizationList,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    LogOut,
    User,
    Users,
    Plus,
    Loader2,
    Trash2,
    Pencil,
    X,
    MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

interface UserMenuProps {
    totalValue?: number;
}

export function UserMenu({ totalValue }: UserMenuProps) {
    const { user } = useUser();
    const { signOut } = useClerk();
    const { organization } = useOrganization();
    const { isLoaded, userMemberships, setActive, createOrganization } =
        useOrganizationList({
            userMemberships: { infinite: true },
        });

    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!user) return null;

    const initials = (
        user.firstName?.[0] ||
        user.emailAddresses[0]?.emailAddress[0] ||
        "U"
    ).toUpperCase();

    const handleSwitch = async (orgId: string) => {
        if (!setActive) return;
        await setActive({ organization: orgId });
    };

    const handleDelete = async (orgId: string, orgName: string) => {
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
            }
        } catch {
            toast.error("Failed to delete store");
        } finally {
            setDeletingId(null);
        }
    };

    const handleRename = async (orgId: string) => {
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
            }
        } catch {
            toast.error("Failed to rename store");
        } finally {
            setRenamingId(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createOrganization || !newName.trim()) return;

        setIsCreating(true);
        try {
            await createOrganization({ name: newName.trim() });
            setNewName("");
            setShowCreate(false);
        } catch {
            toast.error("Failed to create store");
        } finally {
            setIsCreating(false);
        }
    };

    const closeSidebar = () => {
        setOpen(false);
        setShowCreate(false);
        setNewName("");
        setRenamingId(null);
        setMenuOpenId(null);
    };

    const sidebarContent = (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                onClick={closeSidebar}
            />

            {/* Sidebar Panel */}
            <div
                className={`fixed right-0 top-0 bottom-0 z-[101] flex w-80 max-w-[85vw] flex-col border-l border-slate-700/50 bg-slate-950 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {user.imageUrl ? (
                            <img
                                src={user.imageUrl}
                                alt={user.firstName || "User"}
                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                                {user.emailAddresses[0]?.emailAddress}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Stores Section */}
                    {isLoaded &&
                        userMemberships?.data &&
                        userMemberships.data.length > 0 && (
                            <div className="border-b border-slate-800 px-4 py-4">
                                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    Your Stores
                                </p>
                                <div className="flex flex-col gap-1">
                                    {userMemberships.data.map((mem) => (
                                        <div
                                            key={mem.organization.id}
                                            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-800/80"
                                        >
                                            {/* Store Icon */}
                                            <button
                                                onClick={() => handleSwitch(mem.organization.id)}
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm"
                                            >
                                                {(mem.organization.name?.[0] || "?").toUpperCase()}
                                            </button>

                                            {/* Name or Rename Input */}
                                            {renamingId === mem.organization.id ? (
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        handleRename(mem.organization.id);
                                                    }}
                                                    className="flex-1 min-w-0"
                                                >
                                                    <input
                                                        type="text"
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        onBlur={() => handleRename(mem.organization.id)}
                                                        className="h-8 w-full rounded-lg border border-indigo-500 bg-slate-800 px-3 text-sm text-white outline-none"
                                                        autoFocus
                                                    />
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={() => handleSwitch(mem.organization.id)}
                                                    className="flex-1 min-w-0 text-left"
                                                >
                                                    <p className="truncate text-sm font-medium text-slate-200">
                                                        {mem.organization.name}
                                                    </p>
                                                    {organization?.id === mem.organization.id && totalValue !== undefined && (
                                                        <p className="text-[11px] font-semibold text-emerald-400">
                                                            ₹{totalValue.toLocaleString("en-IN")}
                                                        </p>
                                                    )}
                                                </button>
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
                                                                handleDelete(
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

                                {/* Create Store */}
                                <div className="mt-2">
                                    {!showCreate ? (
                                        <button
                                            onClick={() => setShowCreate(true)}
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/10"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create new store
                                        </button>
                                    ) : (
                                        <form
                                            onSubmit={handleCreate}
                                            className="flex gap-2 px-1 pt-1"
                                        >
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="Store name"
                                                className="h-10 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={isCreating || !newName.trim()}
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
                                            >
                                                {isCreating ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Navigation Section */}
                    <div className="px-4 py-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Settings
                        </p>
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={closeSidebar}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                            >
                                <User className="h-4 w-4 text-slate-500" />
                                Profile
                            </button>
                            <Link
                                href="/staff"
                                onClick={closeSidebar}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                            >
                                <Users className="h-4 w-4 text-slate-500" />
                                Staff
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer / Sign Out */}
                <div className="border-t border-slate-800 px-4 py-4">
                    <button
                        onClick={() => {
                            signOut(() => router.push("/sign-in"));
                            closeSidebar();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/80 px-3 py-2 text-sm transition-all hover:border-slate-600 hover:bg-slate-800"
            >
                {user.imageUrl ? (
                    <img
                        src={user.imageUrl}
                        alt={user.firstName || "User"}
                        className="h-7 w-7 rounded-lg object-cover"
                    />
                ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                        {initials}
                    </div>
                )}
            </button>

            {/* Portal sidebar to body - createPortal preserves React context (ClerkProvider) */}
            {mounted && createPortal(sidebarContent, document.body)}
        </>
    );
}
