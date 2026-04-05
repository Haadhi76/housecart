"use client";

import { useRecipes } from "@/lib/queries/recipes";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

export default function RecipesPage() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useRecipes();

  const recipes = data?.pages.flatMap((p) => p.recipes) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Recipes</h1>
        <Link
          href="/dashboard/recipes/new"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">
            No recipes yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first recipe from a URL or manually.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {recipes.map((recipe) => {
              const domain = recipe.source_url
                ? new URL(recipe.source_url).hostname.replace("www.", "")
                : null;
              const ingredientCount = recipe.recipe_ingredients?.length ?? 0;

              return (
                <Link
                  key={recipe.id}
                  href={`/dashboard/recipes/${recipe.id}`}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div>
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                      {recipe.title}
                    </h3>
                    {domain && (
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {domain}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span>{recipe.servings} servings</span>
                    <span>·</span>
                    <span>{ingredientCount} ingredients</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mx-auto block rounded-lg px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
