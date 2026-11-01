import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server.ts";
import { sanitizeRedirectPath } from "../../../lib/auth/redirectSanitizer.ts";

export { sanitizeRedirectPath };

/**
 * Supabase Auth PKCE Code Exchange Route Handler
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const safeNext = sanitizeRedirectPath(rawNext, "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_exchange_failed", requestUrl.origin)
  );
}
