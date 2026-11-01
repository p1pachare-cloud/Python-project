import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "./env.ts";
import type { Database } from "./types.ts";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Creates or retrieves the singleton Supabase browser client.
 * Uses validated public environment configuration.
 * Safe for client-side React components and browser events.
 */
export function createClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient;
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicSupabaseEnv();

  browserClient = createBrowserClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return browserClient;
}
