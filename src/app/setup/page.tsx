"use client";

import { useCreateHousehold, useJoinHousehold } from "@/lib/queries/households";
import { Home, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createHousehold.mutateAsync({ name });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create household");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await joinHousehold.mutateAsync({ invite_code: inviteCode });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join household");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to HouseCart!
          </h1>
          <p className="mt-1 text-gray-600">
            Create or join a household to get started.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Create */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Home className="h-5 w-5 text-emerald-600" />
            Create a Household
          </div>
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Household name"
              required
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={createHousehold.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {createHousehold.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create
            </button>
          </form>
        </div>

        {/* Join */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 text-emerald-600" />
            Join a Household
          </div>
          <form onSubmit={handleJoin} className="mt-4 space-y-3">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter 8-character invite code"
              required
              maxLength={8}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={joinHousehold.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {joinHousehold.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Join
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
