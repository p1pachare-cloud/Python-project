import { z } from "zod";

/**
 * Zod schema for public Supabase and application environment variables.
 * 
 * Strict Mandates:
 * 1. Only NEXT_PUBLIC_ variables are validated and accessible on the client.
 * 2. Secrets (such as SUPABASE_SERVICE_ROLE_KEY) are NEVER declared, referenced, or exposed.
 * 3. Default production URLs or keys must NEVER be silently fabricated.
 */
export const PublicSupabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ message: "NEXT_PUBLIC_SUPABASE_URL is required." })
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. http://127.0.0.1:54321).")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "NEXT_PUBLIC_SUPABASE_URL must use http:// or https:// protocol."
    ),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required." })
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty."),

  NEXT_PUBLIC_APP_URL: z
    .string({ message: "NEXT_PUBLIC_APP_URL is required." })
    .url("NEXT_PUBLIC_APP_URL must be a valid URL (e.g. http://localhost:3000).")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "NEXT_PUBLIC_APP_URL must use http:// or https:// protocol."
    ),
});

export type PublicSupabaseEnv = z.infer<typeof PublicSupabaseEnvSchema>;

/**
 * Validates the provided environment record (or process.env by default).
 * Returns the parsed and validated public environment variables.
 * 
 * Throws a descriptive Error listing all missing or invalid configuration values.
 */
export function validatePublicSupabaseEnv(
  source: Record<string, string | undefined> = process.env
): PublicSupabaseEnv {
  const result = PublicSupabaseEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: source.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const issues = result.error.issues || [];
    const errorDetails = issues
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");

    throw new Error(
      `[PyQuest Supabase Configuration Error] Invalid or missing public environment variables:\n${errorDetails}\n\n` +
      `Please check your .env.local file. See .env.example for required public variables.`
    );
  }

  return result.data;
}

/**
 * Accessor function returning validated public Supabase configuration.
 */
export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return validatePublicSupabaseEnv();
}
