import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { classifyAuthError } from "./lib/auth/errorClassification.ts";
import { transferResponseCookies } from "./lib/auth/cookieTransfer.ts";
import { getPublicSupabaseEnv } from "./lib/supabase/env.ts";
import type { Database } from "./lib/supabase/types.ts";

export { transferResponseCookies };

const PROTECTED_ROUTES = ["/dashboard", "/settings", "/profile", "/api/claim"];
const AUTH_ROUTES = ["/login", "/signup"];

/**
 * Next.js 16 Proxy Route Guard
 * 
 * Responsibilities:
 * 1. Synchronizes session cookies across request/response headers via getAll()/setAll().
 * 2. Authenticates session via Supabase GoTrue getUser().
 * 3. Applies operation-aware error classification:
 *    - CONFIRMED_INVALID: Canonical cookie eviction and redirect to /login with deletion headers preserved.
 *    - TRANSIENT_NETWORK: Preserves user cookies; isolates outages via /auth/unavailable.
 *    - UNKNOWN_ERROR: Preserves cookies and fails closed on protected routes.
 * 4. Redirects authenticated users away from /login and /signup to /dashboard.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let env;
  try {
    env = getPublicSupabaseEnv();
  } catch {
    // If Supabase env is not configured, protect restricted routes and allow public routes
    if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/auth/unavailable", request.url));
    }
    return response;
  }

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (error) {
    const category = classifyAuthError(error, "SESSION_VERIFICATION");

    if (category === "CONFIRMED_INVALID") {
      // Session is confirmed expired or revoked: evict auth cookies across root path
      const authCookies = request.cookies
        .getAll()
        .filter((c) => c.name.startsWith("sb-") || c.name.includes("auth-token"));

      authCookies.forEach((c) => {
        response.cookies.delete({
          name: c.name,
          path: "/",
        });
      });

      if (isProtected) {
        const redirectUrl = new URL(
          `/login?returnTo=${encodeURIComponent(pathname)}`,
          request.url
        );
        const redirectResponse = NextResponse.redirect(redirectUrl);
        return transferResponseCookies(response, redirectResponse);
      }
    } else if (category === "TRANSIENT_NETWORK") {
      // Outage or 5xx: preserve cookies, redirect protected paths to outage page
      if (isProtected) {
        const redirectUrl = new URL("/auth/unavailable", request.url);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        return transferResponseCookies(response, redirectResponse);
      }
    } else {
      // Ambiguous error: preserve cookies and fail closed on protected paths
      if (isProtected) {
        const redirectUrl = new URL("/login?error=auth_error", request.url);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        return transferResponseCookies(response, redirectResponse);
      }
    }
  } else if (user) {
    if (isAuthRoute) {
      const redirectUrl = new URL("/dashboard", request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      return transferResponseCookies(response, redirectResponse);
    }
  } else {
    // Unauthenticated guest user
    if (isProtected) {
      const redirectUrl = new URL(
        `/login?returnTo=${encodeURIComponent(pathname)}`,
        request.url
      );
      const redirectResponse = NextResponse.redirect(redirectUrl);
      return transferResponseCookies(response, redirectResponse);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|workers/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
