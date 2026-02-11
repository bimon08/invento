"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
    UserPlus,
    Loader2,
    Trash2,
    Mail,
    Shield,
    Users,
    Clock,
    X,
} from "lucide-react";
import { toast } from "sonner";

export function StaffManager() {
    const {
        organization,
        memberships,
        invitations,
        isLoaded,
    } = useOrganization({
        memberships: { infinite: true },
        invitations: { infinite: true },
    });

    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"org:admin" | "org:member">("org:member");
    const [isInviting, setIsInviting] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    if (!isLoaded || !organization) return null;

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsInviting(true);
        try {
            await organization.inviteMember({
                emailAddress: email.trim(),
                role,
            });
            setEmail("");
            toast.success(`Invite sent to ${email}`);
            invitations?.revalidate?.();
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            toast.error(
                clerkError.errors?.[0]?.message || "Failed to send invite"
            );
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (membershipId: string, name: string) => {
        if (!confirm(`Remove ${name} from this store?`)) return;

        setRemovingId(membershipId);
        try {
            await organization.removeMember(membershipId);
            toast.success(`${name} removed`);
            memberships?.revalidate?.();
        } catch {
            toast.error("Failed to remove member");
        } finally {
            setRemovingId(null);
        }
    };

    const handleRevokeInvite = async (invitationId: string) => {
        setRevokingId(invitationId);
        try {
            const invite = invitations?.data?.find(
                (i) => i.id === invitationId
            );
            await invite?.revoke?.();
            toast.success("Invite revoked");
            invitations?.revalidate?.();
        } catch {
            toast.error("Failed to revoke invite");
        } finally {
            setRevokingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-lg px-4 py-6">
            {/* Title */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Users className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Staff</h2>
                    <p className="text-xs text-slate-400">{organization.name}</p>
                </div>
            </div>

            {/* Invite Form */}
            <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 shadow-lg shadow-black/10">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <UserPlus className="h-4 w-4 text-indigo-400" />
                    Invite Staff
                </h3>
                <form onSubmit={handleInvite} className="flex flex-col gap-3">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="staff@example.com"
                        className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />

                    <div className="flex gap-2">
                        <select
                            value={role}
                            onChange={(e) =>
                                setRole(e.target.value as "org:admin" | "org:member")
                            }
                            className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                        >
                            <option value="org:member">Member</option>
                            <option value="org:admin">Admin</option>
                        </select>
                        <button
                            type="submit"
                            disabled={isInviting || !email.trim()}
                            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] hover:shadow-indigo-500/35 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isInviting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="h-4 w-4" />
                            )}
                            Invite
                        </button>
                    </div>
                </form>
            </div>

            {/* Current Members */}
            <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-lg shadow-black/10">
                <div className="border-b border-slate-800 px-4 py-3">
                    <h3 className="text-sm font-semibold text-white">
                        Members ({memberships?.data?.length || 0})
                    </h3>
                </div>
                <div className="divide-y divide-slate-800/50">
                    {memberships?.data?.map((mem) => (
                        <div
                            key={mem.id}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                                {(
                                    mem.publicUserData?.firstName?.[0] ||
                                    mem.publicUserData?.identifier?.[0] ||
                                    "?"
                                ).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                    {mem.publicUserData?.firstName
                                        ? `${mem.publicUserData.firstName} ${mem.publicUserData.lastName || ""}`
                                        : mem.publicUserData?.identifier}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                    {mem.publicUserData?.identifier}
                                </p>
                            </div>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${mem.role === "org:admin"
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                                    }`}
                            >
                                {mem.role === "org:admin" ? "Admin" : "Member"}
                            </span>
                            {/* Don't allow removing yourself (the current user with creator role) */}
                            {mem.role !== "org:admin" && (
                                <button
                                    onClick={() =>
                                        handleRemoveMember(
                                            mem.publicUserData?.userId || "",
                                            mem.publicUserData?.firstName ||
                                            mem.publicUserData?.identifier ||
                                            "member"
                                        )
                                    }
                                    disabled={removingId === mem.id}
                                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                >
                                    {removingId === mem.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invites */}
            {invitations?.data && invitations.data.length > 0 && (
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-lg shadow-black/10">
                    <div className="border-b border-slate-800 px-4 py-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Pending Invites ({invitations.data.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                        {invitations.data.map((invite) => (
                            <div
                                key={invite.id}
                                className="flex items-center gap-3 px-4 py-3"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                                    <Mail className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm text-white">
                                        {invite.emailAddress}
                                    </p>
                                    <p className="flex items-center gap-1 text-xs text-slate-500">
                                        <Shield className="h-3 w-3" />
                                        {invite.role === "org:admin" ? "Admin" : "Member"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRevokeInvite(invite.id)}
                                    disabled={revokingId === invite.id}
                                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                >
                                    {revokingId === invite.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
