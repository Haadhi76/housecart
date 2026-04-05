import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function verifyHouseholdMembership(
  supabase: SupabaseClient,
  userId: string,
  householdId: string
): Promise<void> {
  const { data } = await supabase
    .from("household_members")
    .select("user_id")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .single();

  if (!data) {
    throw new Error("FORBIDDEN");
  }
}

export async function getUserHouseholdId(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!data) {
    throw new Error("NO_HOUSEHOLD");
  }
  return data.household_id;
}

export { createClient };
