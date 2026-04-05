import { createClient, getAuthenticatedUser, getUserHouseholdId } from "@/lib/api/auth";
import { createRecipeSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const cursor = request.nextUrl.searchParams.get("cursor");
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 50);

    let query = supabase
      .from("recipes")
      .select("*, recipe_ingredients(count)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: recipes, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    const hasMore = (recipes?.length ?? 0) > limit;
    const items = hasMore ? recipes!.slice(0, limit) : (recipes ?? []);
    const nextCursor = hasMore ? items[items.length - 1].created_at : null;

    return NextResponse.json({ recipes: items, next_cursor: nextCursor });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (message === "NO_HOUSEHOLD") {
      return NextResponse.json({ recipes: [], next_cursor: null });
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const body: unknown = await request.json();
    const parsed = createRecipeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    const { ingredients, ...recipeData } = parsed.data;

    // Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        ...recipeData,
        household_id: householdId,
        added_by: user.id,
      })
      .select()
      .single();

    if (recipeError) {
      return NextResponse.json(
        { error: recipeError.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    // Insert ingredients
    const ingredientRows = ingredients.map((ing, idx) => ({
      recipe_id: recipe.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category ?? "other",
      position: idx,
    }));

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientRows);

    if (ingredientsError) {
      return NextResponse.json(
        { error: ingredientsError.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(recipe, { status: 201 });
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
