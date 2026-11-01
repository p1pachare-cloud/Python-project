/**
 * Generic cookie item matching Next.js ResponseCookie and test mock objects.
 */
export interface CookieLike {
  name: string;
  value: string;
  expires?: Date | number;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
}

/**
 * Interface representing an HTTP response containing cookie operations.
 * Strictly typed with zero `any`.
 */
export interface ResponseWithCookies {
  cookies: {
    getAll(): readonly CookieLike[] | CookieLike[];
    set(cookie: CookieLike): unknown;
  };
}

/**
 * Transfers all cookies set on the source response to the destination redirect response,
 * ensuring deletions (Expires=1970) and refreshed tokens are preserved on redirects.
 */
export function transferResponseCookies<T extends ResponseWithCookies>(
  sourceResponse: ResponseWithCookies,
  destinationResponse: T
): T {
  const cookies = sourceResponse.cookies.getAll();
  cookies.forEach((cookie) => {
    destinationResponse.cookies.set(cookie);
  });
  return destinationResponse;
}
