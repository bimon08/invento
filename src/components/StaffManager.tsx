"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
    Loader2,
    Trash2,
    Shield,
    Users,
    Clock,
    X,
    KeyRound,
    Copy,
    Check,
    RefreshCw,
    UserPlus,
    UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface JoinCodeData {
    id: string;
    code: string;
    role: string;
    orgName: string;
}

interface StaffMemberData {
    id: string;
    username: string;
    createdAt: string;
}

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

    const [removingId, setRemovingId] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState<JoinCodeData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loadingCode, setLoadingCode] = useState(true);
    const [staffMembers, setStaffMembers] = useState<StaffMemberData[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

    // Fetch existing join code
    useEffect(() => {
        async function fetchCode() {
            try {
                const res = await fetch("/api/join-codes");
                const data = await res.json();
                if (data.codes?.length > 0) {
                    setJoinCode(data.codes[0]);
                }
            } catch {
                // Ignore
            } finally {
                setLoadingCode(false);
            }
        }
        if (isLoaded && organization) fetchCode();
    }, [isLoaded, organization]);

    // Fetch staff members who joined via code
    useEffect(() => {
        async function fetchStaff() {
            try {
                const res = await fetch("/api/staff/members");
                const data = await res.json();
                if (data.members) {
                    setStaffMembers(data.members);
                }
            } catch {
                // Ignore
            } finally {
                setLoadingStaff(false);
            }
        }
        if (isLoaded && organization) fetchStaff();
    }, [isLoaded, organization]);

    if (!isLoaded || !organization) return null;

    const generateCode = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/join-codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: "org:member" }),
            });
            const data = await res.json();
            if (res.ok) {
                setJoinCode(data.code);
                toast.success("Staff code generated!");
            } else {
                toast.error(data.error || "Failed to generate code");
            }
        } catch {
            toast.error("Failed to generate code");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyCode = async () => {
        if (!joinCode) return;
        await navigator.clipboard.writeText(joinCode.code);
        setCopied(true);
        toast.success("Code copied!");
        setTimeout(() => setCopied(false), 2000);
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

    const handleDeleteStaffMember = async (staffId: string, username: string) => {
        if (!confirm(`Remove staff member "${username}"? They will no longer be able to log in.`)) return;

        setDeletingStaffId(staffId);
        try {
            const res = await fetch(`/api/staff/members?id=${staffId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setStaffMembers((prev) => prev.filter((m) => m.id !== staffId));
                toast.success(`${username} removed`);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to remove staff member");
            }
        } catch {
            toast.error("Failed to remove staff member");
        } finally {
            setDeletingStaffId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
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

            {/* Staff Code Section */}
            <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 shadow-lg shadow-black/10">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                    <KeyRound className="h-4 w-4 text-indigo-400" />
                    Staff Code
                </h3>
                <p className="mb-4 text-xs text-slate-400">
                    Share this code with your staff. They enter it on the sign-in page to join your store.
                </p>

                {loadingCode ? (
                    <div className="flex h-16 items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    </div>
                ) : joinCode ? (
                    <div className="flex flex-col items-center gap-3">
                        {/* Big code display */}
                        <button
                            onClick={copyCode}
                            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 py-5 transition-all hover:border-indigo-500/50 hover:bg-slate-800 active:scale-[0.98]"
                        >
                            <span className="text-3xl font-mono font-black tracking-[0.4em] text-white">
                                {joinCode.code}
                            </span>
                            {copied ? (
                                <Check className="h-5 w-5 text-emerald-400" />
                            ) : (
                                <Copy className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            )}
                        </button>
                        <p className="text-[11px] text-slate-500">Tap to copy</p>
                        <button
                            onClick={generateCode}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
                        >
                            <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                            Generate new code
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={generateCode}
                        disabled={isGenerating}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] hover:shadow-indigo-500/35 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <KeyRound className="h-4 w-4" />
                        )}
                        Generate Staff Code
                    </button>
                )}
            </div>

            {/* Staff Members (joined via code) */}
            <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-lg shadow-black/10">
                <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <UserCheck className="h-4 w-4 text-emerald-400" />
                        Staff Members
                    </h3>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        {loadingStaff ? "..." : staffMembers.length}
                    </span>
                </div>
                <div className="divide-y divide-slate-800/50">
                    {loadingStaff ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                        </div>
                    ) : staffMembers.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                            <UserPlus className="h-6 w-6 text-slate-600" />
                            <div>
                                <p className="text-sm text-slate-400">No staff members yet</p>
                                <p className="text-xs text-slate-500">
                                    Share the staff code above to invite people
                                </p>
                            </div>
                        </div>
                    ) : (
                        staffMembers.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/20 text-xs font-bold text-emerald-300">
                                    {(member.username[0] || "?").toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-white">
                                        {member.username}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Joined {formatDate(member.createdAt)}
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                                    Staff
                                </span>
                                <button
                                    onClick={() => handleDeleteStaffMember(member.id, member.username)}
                                    disabled={deletingStaffId === member.id}
                                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                >
                                    {deletingStaffId === member.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Organization Members (Clerk) */}
            <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-lg shadow-black/10">
                <div className="border-b border-slate-800 px-4 py-3">
                    <h3 className="text-sm font-semibold text-white">
                        Organization Members ({memberships?.data?.length || 0})
                    </h3>
                </div>
                <div className="divide-y divide-slate-800/50">
                    {memberships?.data?.map((mem) => (
                        <div key={mem.id} className="flex items-center gap-3 px-4 py-3">
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
                            <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                                    <UserPlus className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm text-white">{invite.emailAddress}</p>
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
