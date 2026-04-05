"use client";

import { useClearPurchased } from "@/lib/queries/items";
import { useDeleteList, useLists, useUpdateList } from "@/lib/queries/lists";
import { useListStore } from "@/stores/list-store";
import { MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

interface ListHeaderProps {
  listId: string;
  totalCount: number;
  purchasedCount: number;
}

export function ListHeader({
  listId,
  totalCount,
  purchasedCount,
}: ListHeaderProps) {
  const { data: lists } = useLists();
  const clearPurchased = useClearPurchased();
  const deleteList = useDeleteList();
  const updateList = useUpdateList();
  const { setActiveListId } = useListStore();
  const [showMenu, setShowMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [showConfirm, setShowConfirm] = useState<"clear" | "delete" | null>(
    null
  );

  const currentList = lists?.find((l) => l.id === listId);

  const handleClear = async () => {
    await clearPurchased.mutateAsync(listId);
    setShowConfirm(null);
  };

  const handleDelete = async () => {
    await deleteList.mutateAsync(listId);
    setActiveListId(null);
    setShowConfirm(null);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateList.mutateAsync({ id: listId, name: newName });
    setRenaming(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        {renaming ? (
          <form onSubmit={handleRename} className="flex items-center gap-2">
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
              onClick={() => setRenaming(false)}
              className="text-xs text-gray-400"
            >
              Cancel
            </button>
          </form>
        ) : (
          <h2 className="text-lg font-semibold text-gray-900">
            {currentList?.name ?? "Shopping List"}
          </h2>
        )}
        <p className="text-xs text-gray-500">
          {totalCount} items ({purchasedCount} purchased)
        </p>
      </div>

      <div className="relative flex items-center gap-2">
        {purchasedCount > 0 && (
          <button
            onClick={() => setShowConfirm("clear")}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            Clear Purchased
          </button>
        )}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border bg-white py-1 shadow-lg">
            <button
              onClick={() => {
                setNewName(currentList?.name ?? "");
                setRenaming(true);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="h-3.5 w-3.5" /> Rename
            </button>
            <button
              onClick={() => {
                setShowConfirm("delete");
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Confirmation dialogs */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {showConfirm === "clear"
                  ? "Clear Purchased Items?"
                  : "Delete List?"}
              </h3>
              <button
                onClick={() => setShowConfirm(null)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {showConfirm === "clear"
                ? "All purchased items will be permanently removed."
                : "This list and all its items will be permanently deleted."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={
                  showConfirm === "clear" ? handleClear : handleDelete
                }
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {showConfirm === "clear" ? "Clear" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
