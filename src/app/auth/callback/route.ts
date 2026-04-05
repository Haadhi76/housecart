import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    const errorDescription =
      requestUrl.searchParams.get("error_description") ?? "Authentication failed";
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(exchangeError.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/", request.url));
}
