import { createClient } from "@/lib/supabase/server";
import { createHouseholdSchema } from "@/lib/validations";
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
    const parsed = createHouseholdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    const inviteCode = generateInviteCode();

    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({
        name: parsed.data.name,
        invite_code: inviteCode,
        owner_id: user.id,
      })
      .select()
      .single();

    if (householdError) {
      return NextResponse.json(
        { error: householdError.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    const { error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      return NextResponse.json(
        { error: memberError.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(household, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
