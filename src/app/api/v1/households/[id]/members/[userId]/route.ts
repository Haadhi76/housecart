import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
): Promise<NextResponse> {
  try {
    const { id, userId } = await params;
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

    // Verify caller is the owner
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
        { error: "Only the owner can remove members", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Cannot remove the owner
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself as owner", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("household_members")
      .delete()
      .eq("household_id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
