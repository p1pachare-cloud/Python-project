/**
 * Validates and sanitizes a post-auth redirect target.
 * 
 * Strict Security Rules:
 * 1. Must be a relative path starting with a single '/'
 * 2. Rejects protocol-relative paths starting with '//'
 * 3. Rejects backslash tricks ('/\', '/\\', '\\')
 * 4. Rejects absolute URLs with explicit schemes (e.g. 'https://', 'javascript:')
 * 5. Falls back to defaultPath (/dashboard) on missing, empty, or malicious input
 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!path || typeof path !== "string") {
    return fallback;
  }

  const trimmed = path.trim();

  // Reject paths that don't start with a single slash, start with double slash (protocol-relative),
  // or contain backslashes (which browsers normalize to slashes in some contexts)
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }

  try {
    const dummyOrigin = "http://localhost:3000";
    const parsed = new URL(trimmed, dummyOrigin);

    // Reject if parsing altered the origin (indicating an absolute URL or unexpected scheme)
    if (parsed.origin !== dummyOrigin) {
      return fallback;
    }

    // Return safe relative pathname, search parameters, and hash
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}
