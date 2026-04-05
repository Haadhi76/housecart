"use client";

import { useHousehold, useRegenerateCode, useRemoveMember } from "@/lib/queries/households";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api/client";
import { Check, Copy, Loader2, LogOut, Pencil, RefreshCw, Shield, Trash2, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HouseholdPage() {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const el = document.querySelector("[data-household-id]");
    if (el) {
      setHouseholdId(el.getAttribute("data-household-id"));
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const { data: household, isLoading } = useHousehold(householdId);
  const regenerateCode = useRegenerateCode();
  const removeMember = useRemoveMember();
  const router = useRouter();
  const supabase = createClient();

  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "regenerate" | "remove" | "leave";
    userId?: string;
    name?: string;
  } | null>(null);

  const isOwner = household?.owner_id === currentUserId;

  const handleCopy = async () => {
    if (household?.invite_code) {
      await navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (!householdId) return;
    await regenerateCode.mutateAsync(householdId);
    setConfirmAction(null);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!householdId) return;
    await removeMember.mutateAsync({ householdId, userId });
    setConfirmAction(null);
  };

  const handleLeave = async () => {
    if (!householdId || !currentUserId) return;
    await apiFetch(`/households/${householdId}/members/${currentUserId}`, {
      method: "DELETE",
    });
    router.push("/setup");
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId) return;
    await apiFetch(`/households/${householdId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: newName }),
    });
    setEditingName(false);
    // Force refresh
    window.location.reload();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="py-16 text-center text-gray-500">
        Household not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Household Info */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          {editingName ? (
            <form onSubmit={handleUpdateName} className="flex items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="rounded border px-2 py-1 text-sm"
              />
              <button type="submit" className="text-xs text-emerald-600">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="text-xs text-gray-400"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                {household.name}
              </h2>
              {isOwner && (
                <button
                  onClick={() => {
                    setNewName(household.name);
                    setEditingName(true);
                  }}
                  className="rounded p-1 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Invite Code */}
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">
            Invite Code
          </label>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-gray-50 px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-gray-900">
              {household.invite_code}
            </div>
            <button
              onClick={handleCopy}
              className="rounded-lg border border-gray-200 p-2.5 text-gray-500 transition-colors hover:bg-gray-50"
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
            {isOwner && (
              <button
                onClick={() => setConfirmAction({ type: "regenerate" })}
                className="rounded-lg border border-gray-200 p-2.5 text-gray-500 transition-colors hover:bg-gray-50"
                title="Regenerate code"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Members ({household.members?.length ?? 0})
        </h3>
        <div className="mt-3 space-y-2">
          {(household.members ?? []).map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700">
                  {member.profiles?.display_name?.charAt(0).toUpperCase() ?? (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.profiles?.display_name ?? "Unknown"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {member.role === "owner" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <Shield className="h-3 w-3" /> Owner
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Joined{" "}
                      {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {isOwner && member.user_id !== currentUserId && (
                <button
                  onClick={() =>
                    setConfirmAction({
                      type: "remove",
                      userId: member.user_id,
                      name: member.profiles?.display_name ?? "this member",
                    })
                  }
                  className="rounded p-1.5 text-gray-300 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Account */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Your Account
        </h3>
        <div className="mt-3 space-y-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
          {!isOwner && (
            <button
              onClick={() => setConfirmAction({ type: "leave" })}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Leave Household
            </button>
          )}
        </div>
      </section>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {confirmAction.type === "regenerate"
                  ? "Regenerate Code?"
                  : confirmAction.type === "remove"
                    ? "Remove Member?"
                    : "Leave Household?"}
              </h3>
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {confirmAction.type === "regenerate"
                ? "This will invalidate the old code. Share the new code with members."
                : confirmAction.type === "remove"
                  ? `Remove ${confirmAction.name} from the household?`
                  : "You will be removed from this household."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === "regenerate") handleRegenerate();
                  else if (confirmAction.type === "remove" && confirmAction.userId)
                    handleRemoveMember(confirmAction.userId);
                  else if (confirmAction.type === "leave") handleLeave();
                }}
                disabled={regenerateCode.isPending || removeMember.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {(regenerateCode.isPending || removeMember.isPending) && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
