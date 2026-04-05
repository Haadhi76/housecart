"use client";

import { useAddItem } from "@/lib/queries/items";
import { GROCERY_CATEGORIES } from "@/lib/constants";
import { Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

const UNITS = [
  "kg",
  "g",
  "lbs",
  "oz",
  "litres",
  "ml",
  "pack",
  "bunch",
  "piece",
];

interface AddItemDialogProps {
  listId: string;
  onClose: () => void;
}

export function AddItemDialog({ listId, onClose }: AddItemDialogProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("other");
  const nameRef = useRef<HTMLInputElement>(null);
  const addItem = useAddItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addItem.mutateAsync({
      listId,
      name,
      quantity: parseFloat(quantity) || 1,
      unit: unit || undefined,
      category,
    });
    setName("");
    setQuantity("1");
    setUnit("");
    setCategory("other");
    nameRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Item</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            required
            maxLength={200}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <div className="flex gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qty"
              min="0.01"
              step="any"
              className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">No unit</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {GROCERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={addItem.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {addItem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
