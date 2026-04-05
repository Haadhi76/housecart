import { createClient, getAuthenticatedUser, getUserHouseholdId } from "@/lib/api/auth";
import { updateItemSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string; id: string }> }
): Promise<NextResponse> {
  try {
    const { listId, id } = await params;
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

    // Verify item exists
    const { data: existingItem } = await supabase
      .from("list_items")
      .select("id")
      .eq("id", id)
      .eq("list_id", listId)
      .single();

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    if (parsed.data.is_purchased === true) {
      updateData.purchased_by = user.id;
      updateData.purchased_at = new Date().toISOString();
    } else if (parsed.data.is_purchased === false) {
      updateData.purchased_by = null;
      updateData.purchased_at = null;
    }

    const { data: updated, error } = await supabase
      .from("list_items")
      .update(updateData)
      .eq("id", id)
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
  { params }: { params: Promise<{ listId: string; id: string }> }
): Promise<NextResponse> {
  try {
    const { listId, id } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

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

    const { data: existingItem } = await supabase
      .from("list_items")
      .select("id")
      .eq("id", id)
      .eq("list_id", listId)
      .single();

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("id", id);

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
