import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Check if user has a household
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/setup");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell
      user={{
        id: user.id,
        email: user.email ?? "",
        displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "User",
        avatarUrl: profile?.avatar_url ?? null,
      }}
      householdId={membership.household_id}
    >
      {children}
    </DashboardShell>
  );
}
