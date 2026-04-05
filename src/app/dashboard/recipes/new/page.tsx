"use client";

import { IngredientRow } from "@/components/recipes/ingredient-row";
import { GROCERY_CATEGORIES } from "@/lib/constants";
import { useCreateRecipe, useParseRecipeUrl } from "@/lib/queries/recipes";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface IngredientForm {
  name: string;
  quantity: string;
  unit: string;
  category: string;
}

export default function NewRecipePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"url" | "manual">("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState("4");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<IngredientForm[]>([
    { name: "", quantity: "1", unit: "", category: "other" },
  ]);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseUrl = useParseRecipeUrl();
  const createRecipe = useCreateRecipe();

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);
    try {
      const parsed = await parseUrl.mutateAsync({ url });
      setTitle(parsed.title);
      setServings(String(parsed.servings));
      setSourceUrl(url);
      setIngredients(
        parsed.ingredients.map((ing) => ({
          name: ing.name,
          quantity: String(ing.quantity),
          unit: ing.unit ?? "",
          category: ing.category ?? "other",
        }))
      );
      setTab("manual");
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Failed to parse recipe"
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) return;

    const recipe = await createRecipe.mutateAsync({
      title,
      source_url: sourceUrl || undefined,
      servings: parseInt(servings) || 4,
      notes: notes || undefined,
      ingredients: validIngredients.map((i) => ({
        name: i.name,
        quantity: parseFloat(i.quantity) || 1,
        unit: i.unit || undefined,
        category: i.category || "other",
      })),
    });

    router.push(`/dashboard/recipes/${recipe.id}`);
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: "", quantity: "1", unit: "", category: "other" },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof IngredientForm,
    value: string
  ) => {
    setIngredients(
      ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      )
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Add Recipe</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab("url")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "url"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          From URL
        </button>
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "manual"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Manual
        </button>
      </div>

      {tab === "url" && (
        <form onSubmit={handleParse} className="space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste recipe URL..."
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={parseUrl.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {parseUrl.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Parse Recipe
          </button>
          {parseError && (
            <p className="text-center text-sm text-red-600">{parseError}</p>
          )}
        </form>
      )}

      {tab === "manual" && (
        <form onSubmit={handleSave} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe title"
            required
            maxLength={200}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <div className="flex gap-2">
            <div className="w-24">
              <label className="text-xs text-gray-500">Servings</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                min="1"
                max="100"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Source URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional cooking notes..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Ingredients */}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              Ingredients
            </h2>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <IngredientRow
                  key={idx}
                  ingredient={ing}
                  categories={GROCERY_CATEGORIES}
                  onChange={(field, value) => updateIngredient(idx, field, value)}
                  onRemove={() => removeIngredient(idx)}
                  showRemove={ingredients.length > 1}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 text-sm font-medium text-emerald-600 hover:underline"
            >
              + Add ingredient
            </button>
          </div>

          <button
            type="submit"
            disabled={createRecipe.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {createRecipe.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save Recipe
          </button>
        </form>
      )}
    </div>
  );
}
