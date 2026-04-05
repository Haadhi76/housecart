"use client";

import { X } from "lucide-react";

interface IngredientRowProps {
  ingredient: {
    name: string;
    quantity: string;
    unit: string;
    category: string;
  };
  categories: string[];
  onChange: (field: "name" | "quantity" | "unit" | "category", value: string) => void;
  onRemove: () => void;
  showRemove: boolean;
}

export function IngredientRow({
  ingredient,
  categories,
  onChange,
  onRemove,
  showRemove,
}: IngredientRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={ingredient.name}
        onChange={(e) => onChange("name", e.target.value)}
        placeholder="Ingredient"
        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <input
        type="number"
        value={ingredient.quantity}
        onChange={(e) => onChange("quantity", e.target.value)}
        min="0.01"
        step="any"
        className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <input
        type="text"
        value={ingredient.unit}
        onChange={(e) => onChange("unit", e.target.value)}
        placeholder="unit"
        className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <select
        value={ingredient.category}
        onChange={(e) => onChange("category", e.target.value)}
        className="w-24 rounded-lg border border-gray-300 px-1 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-gray-300 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
