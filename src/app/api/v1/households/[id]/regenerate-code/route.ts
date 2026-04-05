import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(8);
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export async function POST(
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
        { error: "Only the owner can regenerate the invite code", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const newCode = generateInviteCode();

    const { data: updated, error } = await supabase
      .from("households")
      .update({ invite_code: newCode })
      .eq("id", id)
      .select("invite_code")
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
