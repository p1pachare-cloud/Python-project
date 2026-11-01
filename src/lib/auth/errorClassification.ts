/**
 * Operation-aware error classification for Supabase Auth and Next.js Proxy.
 * 
 * Classifies failure states into three mutually exclusive categories:
 * - CONFIRMED_INVALID: Session is confirmed revoked or expired. (Triggers cookie deletion).
 * - TRANSIENT_NETWORK: Outage, 5xx, or network failure. (Preserves cookies, fails closed).
 * - UNKNOWN_ERROR: Ambiguous error or generic 401. (Preserves cookies, fails closed).
 */

export type AuthFailureCategory = 
  | "CONFIRMED_INVALID" 
  | "TRANSIENT_NETWORK" 
  | "UNKNOWN_ERROR";

export type AuthOperationContext = 
  | "SESSION_VERIFICATION"   // Proxy route guard verifying session via getUser()
  | "CREDENTIAL_SIGN_IN"     // User submitting email/password form
  | "USER_REGISTRATION";     // User submitting signup form

const SESSION_INVALID_CODES = new Set([
  "invalid_grant",
  "invalid_jwt",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "bad_jwt",
  "session_expired",
]);

const NETWORK_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNRESET",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
]);

function extractErrorCode(err: unknown, depth = 0): string | undefined {
  if (!err || typeof err !== "object" || depth > 3) return undefined;
  const obj = err as Record<string, unknown>;
  if (typeof obj.code === "string") return obj.code;
  if ("cause" in obj) return extractErrorCode(obj.cause, depth + 1);
  return undefined;
}

export function classifyAuthError(
  error: unknown,
  context: AuthOperationContext = "SESSION_VERIFICATION"
): AuthFailureCategory {
  if (!error) return "UNKNOWN_ERROR";

  if (typeof error === "object") {
    const err = error as Record<string, unknown>;
    const name = typeof err.name === "string" ? err.name : "";
    const status = typeof err.status === "number" ? err.status : undefined;
    const code = typeof err.code === "string" ? err.code : undefined;

    // 1. Session Verification Context (Proxy getUser() checks)
    if (context === "SESSION_VERIFICATION") {
      if (name === "AuthSessionMissingError") {
        return "CONFIRMED_INVALID";
      }

      // Explicit Supabase GoTrue machine codes during token refresh
      if (code && SESSION_INVALID_CODES.has(code)) {
        return "CONFIRMED_INVALID";
      }
    }

    // 2. Duck-typed Supabase Retryable Fetch Error (independent of instanceof)
    if (name === "AuthRetryableFetchError") {
      return "TRANSIENT_NETWORK";
    }

    // 3. Upstream HTTP 5xx Server Errors from Supabase
    if (status !== undefined && status >= 500 && status <= 504) {
      return "TRANSIENT_NETWORK";
    }

    // 4. Socket and POSIX Network Failures (deep cause inspection)
    const deepCode = extractErrorCode(err);
    if (deepCode && NETWORK_ERROR_CODES.has(deepCode)) {
      return "TRANSIENT_NETWORK";
    }

    // Node.js / Undici fetch failures
    if (err instanceof TypeError && err.message === "fetch failed") {
      return "TRANSIENT_NETWORK";
    }
  }

  // 5. Generic 401s, invalid credentials, or unclassified errors
  // Preserves cookies to prevent spurious logout caused by upstream proxy glitches
  return "UNKNOWN_ERROR";
}
