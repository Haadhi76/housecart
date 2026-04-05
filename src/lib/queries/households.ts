import { apiFetch } from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Household {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
  members?: Array<{
    user_id: string;
    role: string;
    joined_at: string;
    profiles: { display_name: string; avatar_url: string | null };
  }>;
}

export function useHousehold(id: string | null) {
  return useQuery<Household>({
    queryKey: ["household", id],
    queryFn: () => apiFetch<Household>(`/households/${id}`),
    enabled: !!id,
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiFetch<Household>("/households", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { invite_code: string }) =>
      apiFetch<Household>("/households/join", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, userId }: { householdId: string; userId: string }) =>
      apiFetch(`/households/${householdId}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["household", variables.householdId] });
    },
  });
}

export function useRegenerateCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (householdId: string) =>
      apiFetch<{ invite_code: string }>(`/households/${householdId}/regenerate-code`, {
        method: "POST",
      }),
    onSuccess: (_data, householdId) => {
      queryClient.invalidateQueries({ queryKey: ["household", householdId] });
    },
  });
}
