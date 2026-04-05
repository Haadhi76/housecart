"use client";

import { useDeleteItem, useUpdateItem, type ListItem } from "@/lib/queries/items";
import { Check, Trash2 } from "lucide-react";

interface ListItemRowProps {
  item: ListItem;
  listId: string;
}

export function ListItemRow({ item, listId }: ListItemRowProps) {
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const handleToggle = () => {
    updateItem.mutate({
      listId,
      itemId: item.id,
      is_purchased: !item.is_purchased,
    });
  };

  const handleDelete = () => {
    deleteItem.mutate({ listId, itemId: item.id });
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        item.is_purchased
          ? "border-gray-100 bg-gray-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <button
        onClick={handleToggle}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          item.is_purchased
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-gray-300 hover:border-emerald-400"
        }`}
      >
        {item.is_purchased && <Check className="h-3.5 w-3.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            item.is_purchased ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {item.name}
        </p>
        <p className="text-xs text-gray-400">
          {item.quantity} {item.unit ?? ""}
          {item.is_purchased && item.purchased_by_profile && (
            <span> · by {item.purchased_by_profile.display_name}</span>
          )}
        </p>
      </div>

      <button
        onClick={handleDelete}
        className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
