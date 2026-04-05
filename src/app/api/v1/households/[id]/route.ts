import { createClient } from "@/lib/supabase/server";
import { updateHouseholdSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Verify user is a member
    const { data: membership } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this household", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Fetch household
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("*")
      .eq("id", id)
      .single();

    if (householdError || !household) {
      return NextResponse.json(
        { error: "Household not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Fetch members with profiles
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id, role, joined_at, profiles(display_name, avatar_url)")
      .eq("household_id", id);

    return NextResponse.json({ ...household, members: members ?? [] });
  } catch {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateHouseholdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    // Verify user is the owner
    const { data: household } = await supabase
      .from("households")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!household) {
      return NextResponse.json(
        { error: "Household not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (household.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Only the owner can update the household", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { data: updated, error } = await supabase
      .from("households")
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
  } catch {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
