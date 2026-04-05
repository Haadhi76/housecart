import { apiFetch } from "@/lib/api/client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Recipe {
  id: string;
  household_id: string;
  title: string;
  source_url: string | null;
  servings: number;
  notes: string | null;
  added_by: string;
  created_at: string;
  recipe_ingredients?: RecipeIngredient[];
}

interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string;
  position: number;
}

interface RecipesPage {
  recipes: Recipe[];
  next_cursor: string | null;
}

interface ParsedRecipe {
  title: string;
  servings: number;
  ingredients: {
    name: string;
    quantity: number;
    unit?: string;
    category: string;
  }[];
}

export function useRecipes() {
  return useInfiniteQuery<RecipesPage>({
    queryKey: ["recipes"],
    queryFn: ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : "";
      return apiFetch<RecipesPage>(`/recipes${params}`);
    },
    initialPageParam: "" as string,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
}

export function useRecipe(id: string | null) {
  return useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => apiFetch<Recipe>(`/recipes/${id}`),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      source_url?: string;
      servings?: number;
      notes?: string;
      ingredients: { name: string; quantity: number; unit?: string; category?: string }[];
    }) =>
      apiFetch<Recipe>("/recipes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useParseRecipeUrl() {
  return useMutation({
    mutationFn: (data: { url: string }) =>
      apiFetch<ParsedRecipe>("/recipes/parse-url", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useAddRecipeToList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      recipeId,
      ...data
    }: {
      recipeId: string;
      list_id: string;
      servings?: number;
    }) =>
      apiFetch<{ added_count: number; merged_count: number }>(
        `/recipes/${recipeId}/add-to-list`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.list_id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/recipes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
