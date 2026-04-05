"use client";

import { useCreateList } from "@/lib/queries/lists";
import { Loader2, X } from "lucide-react";
import { useState } from "react";

interface CreateListDialogProps {
  onClose: () => void;
}

export function CreateListDialog({ onClose }: CreateListDialogProps) {
  const [name, setName] = useState("");
  const createList = useCreateList();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createList.mutateAsync({ name });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New List</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="List name"
            required
            maxLength={100}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={createList.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {createList.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Create List
          </button>
        </form>
      </div>
    </div>
  );
}
