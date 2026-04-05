"use client";

import { useListItems, type ListItem } from "@/lib/queries/items";
import { useLists } from "@/lib/queries/lists";
import { useRealtimeItems } from "@/hooks/use-realtime-items";
import { useListStore } from "@/stores/list-store";
import { ListItemRow } from "@/components/lists/list-item-row";
import { AddItemDialog } from "@/components/lists/add-item-dialog";
import { CreateListDialog } from "@/components/lists/create-list-dialog";
import { ListHeader } from "@/components/lists/list-header";
import { Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { activeListId, setActiveListId } = useListStore();
  const { data: lists, isLoading: listsLoading } = useLists();
  const { data: items, isLoading: itemsLoading } = useListItems(activeListId);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);

  useRealtimeItems(activeListId);

  // Set default active list
  useEffect(() => {
    if (!activeListId && lists && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId, setActiveListId]);

  // Group items by category
  const groupedItems = (items ?? []).reduce<Record<string, ListItem[]>>(
    (acc, item) => {
      const cat = item.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {}
  );

  const purchasedCount = (items ?? []).filter((i) => i.is_purchased).length;
  const totalCount = (items ?? []).length;

  if (listsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* List selector */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
          {(lists ?? []).map((list) => (
            <button
              key={list.id}
              onClick={() => setActiveListId(list.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeListId === list.id
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {list.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreateList(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-colors hover:bg-emerald-200"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {activeListId && (
        <ListHeader
          listId={activeListId}
          totalCount={totalCount}
          purchasedCount={purchasedCount}
        />
      )}

      {/* Items */}
      {itemsLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No items yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first item to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <span>{category}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal">
                    {categoryItems.length}
                  </span>
                </h3>
                <div className="space-y-1">
                  {categoryItems.map((item) => (
                    <ListItemRow
                      key={item.id}
                      item={item}
                      listId={activeListId!}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* FAB */}
      {activeListId && (
        <button
          onClick={() => setShowAddItem(true)}
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Dialogs */}
      {showAddItem && activeListId && (
        <AddItemDialog
          listId={activeListId}
          onClose={() => setShowAddItem(false)}
        />
      )}
      {showCreateList && (
        <CreateListDialog onClose={() => setShowCreateList(false)} />
      )}
    </div>
  );
}
