"use client";

import { useAddRecipeToList, useDeleteRecipe, useRecipe } from "@/lib/queries/recipes";
import { useLists } from "@/lib/queries/lists";
import { ArrowLeft, ExternalLink, Loader2, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: recipe, isLoading } = useRecipe(id);
  const { data: lists } = useLists();
  const deleteRecipe = useDeleteRecipe();
  const addToList = useAddRecipeToList();

  const [adjustedServings, setAdjustedServings] = useState<number | null>(null);
  const [showAddToList, setShowAddToList] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-lg font-medium text-gray-900">Recipe not found</h2>
        <Link href="/dashboard/recipes" className="mt-2 text-sm text-emerald-600">
          Back to recipes
        </Link>
      </div>
    );
  }

  const servings = adjustedServings ?? recipe.servings;
  const scaleFactor = servings / (recipe.servings || 4);

  const handleDelete = async () => {
    await deleteRecipe.mutateAsync(recipe.id);
    router.push("/dashboard/recipes");
  };

  const handleAddToList = async () => {
    if (!selectedListId) return;
    const result = await addToList.mutateAsync({
      recipeId: recipe.id,
      list_id: selectedListId,
      servings,
    });
    const listName = lists?.find((l) => l.id === selectedListId)?.name ?? "list";
    setSuccessMessage(
      `Added ${result.added_count} ingredients to ${listName}${result.merged_count > 0 ? ` (${result.merged_count} merged)` : ""}`
    );
    setShowAddToList(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/recipes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
          >
            View source <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Servings adjuster */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Servings</span>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1">
          <button
            onClick={() => setAdjustedServings(Math.max(1, servings - 1))}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">
            {servings}
          </span>
          <button
            onClick={() => setAdjustedServings(servings + 1)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {recipe.notes && (
        <p className="text-sm text-gray-600">{recipe.notes}</p>
      )}

      {/* Ingredients */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Ingredients
        </h2>
        <ul className="space-y-1.5">
          {(recipe.recipe_ingredients ?? []).map((ing) => (
            <li
              key={ing.id}
              className="flex items-baseline gap-2 text-sm text-gray-700"
            >
              <span className="font-medium">
                {(Number(ing.quantity) * scaleFactor).toFixed(
                  Number(ing.quantity) * scaleFactor === Math.round(Number(ing.quantity) * scaleFactor) ? 0 : 1
                )}
              </span>
              {ing.unit && <span className="text-gray-500">{ing.unit}</span>}
              <span>{ing.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => {
            setSelectedListId(lists?.[0]?.id ?? "");
            setShowAddToList(true);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <ShoppingCart className="h-4 w-4" /> Add to Shopping List
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-lg border border-red-200 px-4 py-3 text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Add to list dialog */}
      {showAddToList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Add to List</h3>
              <button
                onClick={() => setShowAddToList(false)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
              >
                {(lists ?? []).map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                {(recipe.recipe_ingredients ?? []).length} ingredients for{" "}
                {servings} servings
              </p>
              <button
                onClick={handleAddToList}
                disabled={addToList.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {addToList.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Add Ingredients
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold">Delete Recipe?</h3>
            <p className="mt-2 text-sm text-gray-500">
              This recipe will be permanently deleted.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteRecipe.isPending}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
