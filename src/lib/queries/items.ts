import { apiFetch } from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string;
  is_purchased: boolean;
  purchased_by: string | null;
  purchased_at: string | null;
  added_by: string;
  recipe_id: string | null;
  created_at: string;
  added_by_profile?: { display_name: string } | null;
  purchased_by_profile?: { display_name: string } | null;
}

export function useListItems(listId: string | null) {
  return useQuery<ListItem[]>({
    queryKey: ["items", listId],
    queryFn: () => apiFetch<ListItem[]>(`/lists/${listId}/items`),
    enabled: !!listId,
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      ...data
    }: {
      listId: string;
      name: string;
      quantity?: number;
      unit?: string;
      category?: string;
    }) =>
      apiFetch<ListItem>(`/lists/${listId}/items`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.listId] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      ...data
    }: {
      listId: string;
      itemId: string;
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
      is_purchased?: boolean;
    }) =>
      apiFetch<ListItem>(`/lists/${listId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async (variables) => {
      // Optimistic update for purchase toggle
      if (variables.is_purchased !== undefined) {
        await queryClient.cancelQueries({ queryKey: ["items", variables.listId] });
        const previousItems = queryClient.getQueryData<ListItem[]>(["items", variables.listId]);

        queryClient.setQueryData<ListItem[]>(
          ["items", variables.listId],
          (old) =>
            old?.map((item) =>
              item.id === variables.itemId
                ? { ...item, is_purchased: variables.is_purchased! }
                : item
            ) ?? []
        );

        return { previousItems };
      }
    },
    onError: (_err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["items", variables.listId], context.previousItems);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.listId] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      apiFetch(`/lists/${listId}/items/${itemId}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.listId] });
    },
  });
}

export function useClearPurchased() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) =>
      apiFetch<{ deleted_count: number }>(`/lists/${listId}/clear-purchased`, {
        method: "POST",
      }),
    onSuccess: (_data, listId) => {
      queryClient.invalidateQueries({ queryKey: ["items", listId] });
    },
  });
}
