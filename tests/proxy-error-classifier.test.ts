import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyAuthError } from "../src/lib/auth/errorClassification.ts";

describe("Proxy Operation-Aware Error Classifier", () => {
  describe("Session Verification Context", () => {
    it("classifies AuthSessionMissingError as CONFIRMED_INVALID", () => {
      const err = { name: "AuthSessionMissingError", message: "Auth session missing" };
      assert.equal(classifyAuthError(err, "SESSION_VERIFICATION"), "CONFIRMED_INVALID");
    });

    it("classifies explicit refresh token failure codes as CONFIRMED_INVALID", () => {
      assert.equal(classifyAuthError({ code: "invalid_grant" }, "SESSION_VERIFICATION"), "CONFIRMED_INVALID");
      assert.equal(classifyAuthError({ code: "refresh_token_not_found" }, "SESSION_VERIFICATION"), "CONFIRMED_INVALID");
      assert.equal(classifyAuthError({ code: "session_expired" }, "SESSION_VERIFICATION"), "CONFIRMED_INVALID");
      assert.equal(classifyAuthError({ code: "invalid_jwt" }, "SESSION_VERIFICATION"), "CONFIRMED_INVALID");
    });

    it("classifies generic 401 without Supabase error codes as UNKNOWN_ERROR (preserves cookies)", () => {
      const generic401 = { status: 401, message: "Unauthorized" };
      assert.equal(classifyAuthError(generic401, "SESSION_VERIFICATION"), "UNKNOWN_ERROR");
    });
  });

  describe("Credential Sign-In Context", () => {
    it("does NOT classify invalid_grant during sign-in as CONFIRMED_INVALID session", () => {
      // Bad password on login should not trigger session cookie eviction
      const badCreds = { code: "invalid_grant", message: "Invalid login credentials" };
      assert.equal(classifyAuthError(badCreds, "CREDENTIAL_SIGN_IN"), "UNKNOWN_ERROR");
    });
  });

  describe("Transient Network & Outage Failures", () => {
    it("identifies AuthRetryableFetchError independently of instanceof", () => {
      const duckError = { name: "AuthRetryableFetchError", message: "Failed to fetch" };
      assert.equal(classifyAuthError(duckError), "TRANSIENT_NETWORK");
    });

    it("identifies HTTP 5xx errors from Supabase as TRANSIENT_NETWORK", () => {
      assert.equal(classifyAuthError({ status: 500 }), "TRANSIENT_NETWORK");
      assert.equal(classifyAuthError({ status: 502 }), "TRANSIENT_NETWORK");
      assert.equal(classifyAuthError({ status: 503 }), "TRANSIENT_NETWORK");
      assert.equal(classifyAuthError({ status: 504 }), "TRANSIENT_NETWORK");
    });

    it("identifies nested socket and network codes", () => {
      const fetchError = new TypeError("fetch failed");
      (fetchError as unknown as { cause: { code: string } }).cause = { code: "ECONNREFUSED" };
      assert.equal(classifyAuthError(fetchError), "TRANSIENT_NETWORK");

      const timeoutError = { cause: { cause: { code: "ETIMEDOUT" } } };
      assert.equal(classifyAuthError(timeoutError), "TRANSIENT_NETWORK");

      const dnsError = { code: "ENOTFOUND" };
      assert.equal(classifyAuthError(dnsError), "TRANSIENT_NETWORK");
    });
  });

  describe("Unknown & Ambiguous Failures", () => {
    it("classifies unexpected errors as UNKNOWN_ERROR", () => {
      assert.equal(classifyAuthError(new Error("Unexpected crash")), "UNKNOWN_ERROR");
      assert.equal(classifyAuthError({ status: 403, message: "Forbidden" }), "UNKNOWN_ERROR");
      assert.equal(classifyAuthError(null), "UNKNOWN_ERROR");
      assert.equal(classifyAuthError(undefined), "UNKNOWN_ERROR");
    });
  });
});
