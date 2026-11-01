import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "./env.ts";
import type { Database } from "./types.ts";

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * In Next.js 16, cookies() is an asynchronous call.
 * 
 * Cookie persistence utilizes the canonical getAll() and setAll() methods.
 * Any write attempts within Server Components are safely caught and ignored,
 * as session cookie refresh is orchestrated by the Next.js Proxy/Middleware layer.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicSupabaseEnv();

  return createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignored when called from Server Component (read-only cookie store)
          }
        },
      },
    }
  );
}
