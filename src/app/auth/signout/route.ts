import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server.ts";

/**
 * Supabase Auth Signout Route Handler
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
