import { createClient, getAuthenticatedUser, getUserHouseholdId, verifyHouseholdMembership } from "@/lib/api/auth";
import { createListSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const householdId = await getUserHouseholdId(supabase, user.id);

    const { data: lists, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(lists);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (message === "NO_HOUSEHOLD") {
      return NextResponse.json([], { status: 200 });
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
    const parsed = createListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    await verifyHouseholdMembership(supabase, user.id, householdId);

    const { data: list, error } = await supabase
      .from("shopping_lists")
      .insert({
        name: parsed.data.name,
        household_id: householdId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(list, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (message === "FORBIDDEN" || message === "NO_HOUSEHOLD") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
