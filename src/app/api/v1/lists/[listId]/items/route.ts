import { createClient, getAuthenticatedUser, getUserHouseholdId } from "@/lib/api/auth";
import { createItemSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

async function verifyListBelongsToHousehold(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listId: string,
  householdId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("shopping_lists")
    .select("household_id")
    .eq("id", listId)
    .single();

  return data?.household_id === householdId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
): Promise<NextResponse> {
  try {
    const { listId } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    if (!(await verifyListBelongsToHousehold(supabase, listId, householdId))) {
      return NextResponse.json(
        { error: "List not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    let query = supabase
      .from("list_items")
      .select("*, added_by_profile:profiles!list_items_added_by_fkey(display_name), purchased_by_profile:profiles!list_items_purchased_by_fkey(display_name)")
      .eq("list_id", listId);

    const purchased = request.nextUrl.searchParams.get("purchased");
    if (purchased === "true") {
      query = query.eq("is_purchased", true);
    } else if (purchased === "false") {
      query = query.eq("is_purchased", false);
    }

    const { data: items, error } = await query
      .order("is_purchased", { ascending: true })
      .order("category", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(items);
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
): Promise<NextResponse> {
  try {
    const { listId } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    if (!(await verifyListBelongsToHousehold(supabase, listId, householdId))) {
      return NextResponse.json(
        { error: "List not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    const { data: item, error } = await supabase
      .from("list_items")
      .insert({
        list_id: listId,
        name: parsed.data.name,
        quantity: parsed.data.quantity ?? 1,
        unit: parsed.data.unit,
        category: parsed.data.category ?? "other",
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(item, { status: 201 });
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
