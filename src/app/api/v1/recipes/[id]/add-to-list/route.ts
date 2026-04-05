import { createClient, getAuthenticatedUser, getUserHouseholdId } from "@/lib/api/auth";
import { addRecipeToListSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const body: unknown = await request.json();
    const parsed = addRecipeToListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    // Fetch recipe
    const { data: recipe } = await supabase
      .from("recipes")
      .select("id, servings, household_id")
      .eq("id", id)
      .eq("household_id", householdId)
      .single();

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Fetch ingredients separately
    const { data: ingredients } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", id)
      .order("position");

    // Verify target list
    const { data: list } = await supabase
      .from("shopping_lists")
      .select("household_id")
      .eq("id", parsed.data.list_id)
      .single();

    if (!list || list.household_id !== householdId) {
      return NextResponse.json(
        { error: "List not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const requestedServings = parsed.data.servings ?? recipe.servings;
    const scaleFactor = requestedServings / (recipe.servings || 4);

    // Fetch existing items in the list (not purchased)
    const { data: existingItems } = await supabase
      .from("list_items")
      .select("id, name, quantity")
      .eq("list_id", parsed.data.list_id)
      .eq("is_purchased", false);

    const existingMap = new Map<string, { id: string; quantity: number }>();
    (existingItems ?? []).forEach((item) => {
      existingMap.set(item.name.toLowerCase(), {
        id: item.id,
        quantity: Number(item.quantity),
      });
    });

    let addedCount = 0;
    let mergedCount = 0;

    for (const ingredient of (ingredients ?? [])) {
      const scaledQuantity = Number(ingredient.quantity) * scaleFactor;
      const existing = existingMap.get(ingredient.name.toLowerCase());

      if (existing) {
        // Merge: add quantity
        await supabase
          .from("list_items")
          .update({ quantity: existing.quantity + scaledQuantity })
          .eq("id", existing.id);
        mergedCount++;
      } else {
        // Insert new item
        await supabase.from("list_items").insert({
          list_id: parsed.data.list_id,
          name: ingredient.name,
          quantity: scaledQuantity,
          unit: ingredient.unit,
          category: ingredient.category ?? "other",
          added_by: user.id,
          recipe_id: recipe.id,
        });
        addedCount++;
      }
    }

    return NextResponse.json({ added_count: addedCount, merged_count: mergedCount });
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
