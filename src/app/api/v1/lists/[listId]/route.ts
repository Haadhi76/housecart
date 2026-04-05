import { createClient, getAuthenticatedUser, getUserHouseholdId } from "@/lib/api/auth";
import { updateListSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
): Promise<NextResponse> {
  try {
    const { listId } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const body: unknown = await request.json();
    const parsed = updateListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    // Verify list belongs to user's household
    const { data: list } = await supabase
      .from("shopping_lists")
      .select("household_id")
      .eq("id", listId)
      .single();

    if (!list) {
      return NextResponse.json(
        { error: "List not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (list.household_id !== householdId) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { data: updated, error } = await supabase
      .from("shopping_lists")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", listId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
): Promise<NextResponse> {
  try {
    const { listId } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const { data: list } = await supabase
      .from("shopping_lists")
      .select("household_id")
      .eq("id", listId)
      .single();

    if (!list) {
      return NextResponse.json(
        { error: "List not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (list.household_id !== householdId) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", listId);

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
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
