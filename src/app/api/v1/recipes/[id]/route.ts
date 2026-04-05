import { createClient, getAuthenticatedUser, getUserHouseholdId } from "@/lib/api/auth";
import { updateRecipeSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const { data: recipe, error } = await supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)")
      .eq("id", id)
      .eq("household_id", householdId)
      .order("position", { ascending: true, referencedTable: "recipe_ingredients" })
      .single();

    if (error || !recipe) {
      return NextResponse.json(
        { error: "Recipe not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const body: unknown = await request.json();
    const parsed = updateRecipeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    // Verify recipe belongs to household
    const { data: existing } = await supabase
      .from("recipes")
      .select("household_id")
      .eq("id", id)
      .single();

    if (!existing || existing.household_id !== householdId) {
      return NextResponse.json(
        { error: "Recipe not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { data: updated, error } = await supabase
      .from("recipes")
      .update(parsed.data)
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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const { data: existing } = await supabase
      .from("recipes")
      .select("household_id")
      .eq("id", id)
      .single();

    if (!existing || existing.household_id !== householdId) {
      return NextResponse.json(
        { error: "Recipe not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("recipes").delete().eq("id", id);

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
