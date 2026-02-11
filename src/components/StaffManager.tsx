"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
    UserPlus,
    Loader2,
    Trash2,
    Shield,
    Users,
    Clock,
    X,
    Link2,
    Copy,
    Check,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface JoinCodeData {
    id: string;
    code: string;
    role: string;
    orgName: string;
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

    if (!isLoaded || !organization) return null;

    // Fetch existing join code
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        async function fetchCode() {
            try {
                const res = await fetch("/api/join-codes");
                const data = await res.json();
                if (data.codes?.length > 0) {
                    setJoinCode(data.codes[0]);
                }
            } catch {
                // Ignore — no existing code
            } finally {
                setLoadingCode(false);
            }
        }
        fetchCode();
    }, []);

    const generateInviteLink = async () => {
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
                toast.success("Invite link generated!");
            } else {
                toast.error(data.error || "Failed to generate link");
            }
        } catch {
            toast.error("Failed to generate invite link");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyLink = async () => {
        if (!joinCode) return;
        const link = `${window.location.origin}/join/${joinCode.code}`;
        await navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success("Invite link copied!");
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

            {/* Invite Link Section */}
            <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 shadow-lg shadow-black/10">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Link2 className="h-4 w-4 text-indigo-400" />
                    Invite Link
                </h3>
                <p className="mb-3 text-xs text-slate-400">
                    Share this link with staff to let them join your store. No email required.
                </p>

                {loadingCode ? (
                    <div className="flex h-11 items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    </div>
                ) : joinCode ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-11 flex-1 items-center rounded-xl border border-slate-700 bg-slate-800 px-4">
                                <code className="text-sm font-mono text-indigo-300 truncate">
                                    {typeof window !== "undefined"
                                        ? `${window.location.origin}/join/${joinCode.code}`
                                        : `/join/${joinCode.code}`}
                                </code>
                            </div>
                            <button
                                onClick={copyLink}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition-all hover:border-indigo-500/50 hover:text-indigo-400 active:scale-95"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <button
                            onClick={generateInviteLink}
                            disabled={isGenerating}
                            className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
                        >
                            <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                            Generate new link
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={generateInviteLink}
                        disabled={isGenerating}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] hover:shadow-indigo-500/35 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Link2 className="h-4 w-4" />
                        )}
                        Generate Invite Link
                    </button>
                )}
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
                                    <UserPlus className="h-4 w-4 text-slate-500" />
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
