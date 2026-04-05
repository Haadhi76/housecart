import { createClient, getAuthenticatedUser, getUserHouseholdId } from "@/lib/api/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
): Promise<NextResponse> {
  try {
    const { listId } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    // Verify list belongs to household
    const { data: list } = await supabase
      .from("shopping_lists")
      .select("household_id")
      .eq("id", listId)
      .single();

    if (!list || list.household_id !== householdId) {
      return NextResponse.json(
        { error: "List not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", listId)
      .eq("is_purchased", true)
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted_count: data?.length ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
