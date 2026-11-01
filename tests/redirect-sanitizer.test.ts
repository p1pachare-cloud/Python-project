import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeRedirectPath } from "../src/lib/auth/redirectSanitizer.ts";

describe("PKCE Callback Redirect Sanitizer (ISSUE-M1)", () => {
  it("accepts safe internal path /dashboard", () => {
    assert.equal(sanitizeRedirectPath("/dashboard"), "/dashboard");
  });

  it("accepts safe internal path /settings", () => {
    assert.equal(sanitizeRedirectPath("/settings"), "/settings");
  });

  it("preserves safe query strings and hash anchors on internal paths", () => {
    assert.equal(
      sanitizeRedirectPath("/settings?tab=profile#section"),
      "/settings?tab=profile#section"
    );
  });

  it("rejects absolute URL with protocol https://malicious.test", () => {
    assert.equal(sanitizeRedirectPath("https://malicious.test"), "/dashboard");
  });

  it("rejects protocol-relative URL //malicious.test", () => {
    assert.equal(sanitizeRedirectPath("//malicious.test"), "/dashboard");
  });

  it("rejects backslash-based trick /\\\\malicious.test", () => {
    assert.equal(sanitizeRedirectPath("/\\malicious.test"), "/dashboard");
  });

  it("rejects single backslash trick /\\malicious.test", () => {
    assert.equal(sanitizeRedirectPath("/\\malicious.test"), "/dashboard");
  });

  it("rejects javascript: scheme", () => {
    assert.equal(sanitizeRedirectPath("javascript:alert(1)"), "/dashboard");
  });

  it("falls back to /dashboard on missing (null/undefined) input", () => {
    assert.equal(sanitizeRedirectPath(null), "/dashboard");
    assert.equal(sanitizeRedirectPath(undefined), "/dashboard");
  });

  it("falls back to /dashboard on empty string or whitespace", () => {
    assert.equal(sanitizeRedirectPath(""), "/dashboard");
    assert.equal(sanitizeRedirectPath("   "), "/dashboard");
  });

  it("respects custom fallback when supplied", () => {
    assert.equal(sanitizeRedirectPath("https://evil.test", "/courses"), "/courses");
  });
});
