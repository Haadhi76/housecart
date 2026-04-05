import { createClient } from "@/lib/supabase/server";
import { joinHouseholdSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

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
    const parsed = joinHouseholdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    const { data: household, error } = await supabase.rpc("join_household", {
      code: parsed.data.invite_code,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "JOIN_FAILED" },
        { status: 400 }
      );
    }

    return NextResponse.json(household);
  } catch {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
