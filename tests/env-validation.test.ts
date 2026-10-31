import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PublicSupabaseEnvSchema,
  validatePublicSupabaseEnv,
} from "../src/lib/supabase/env.ts";

describe("Public Supabase Environment Validation", () => {
  it("validates a complete, correctly formatted public environment", () => {
    const validRaw = {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyValidAnonKeyPlaceholder.abc.123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };

    const validated = validatePublicSupabaseEnv(validRaw);
    assert.equal(validated.NEXT_PUBLIC_SUPABASE_URL, "http://127.0.0.1:54321");
    assert.equal(validated.NEXT_PUBLIC_SUPABASE_ANON_KEY, "eyValidAnonKeyPlaceholder.abc.123");
    assert.equal(validated.NEXT_PUBLIC_APP_URL, "http://localhost:3000");
  });

  it("accepts https:// URLs for production configurations", () => {
    const validProd = {
      NEXT_PUBLIC_SUPABASE_URL: "https://project-ref.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-string",
      NEXT_PUBLIC_APP_URL: "https://pyquest.example.com",
    };

    const validated = validatePublicSupabaseEnv(validProd);
    assert.equal(validated.NEXT_PUBLIC_SUPABASE_URL, "https://project-ref.supabase.co");
  });

  it("rejects missing NEXT_PUBLIC_SUPABASE_URL", () => {
    const missingUrl = {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-string",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };

    assert.throws(
      () => validatePublicSupabaseEnv(missingUrl),
      (err: Error) => {
        assert.match(err.message, /NEXT_PUBLIC_SUPABASE_URL is required/);
        return true;
      }
    );
  });

  it("rejects non-http/https protocol in NEXT_PUBLIC_SUPABASE_URL", () => {
    const invalidProto = {
      NEXT_PUBLIC_SUPABASE_URL: "ftp://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-string",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };

    assert.throws(
      () => validatePublicSupabaseEnv(invalidProto),
      (err: Error) => {
        assert.match(err.message, /must use http:\/\/ or https:\/\/ protocol/);
        return true;
      }
    );
  });

  it("rejects empty NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
    const emptyKey = {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };

    assert.throws(
      () => validatePublicSupabaseEnv(emptyKey),
      (err: Error) => {
        assert.match(err.message, /NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty/);
        return true;
      }
    );
  });

  it("rejects malformed NEXT_PUBLIC_APP_URL", () => {
    const malformedAppUrl = {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-string",
      NEXT_PUBLIC_APP_URL: "not-a-valid-url",
    };

    assert.throws(
      () => validatePublicSupabaseEnv(malformedAppUrl),
      (err: Error) => {
        assert.match(err.message, /NEXT_PUBLIC_APP_URL must be a valid URL/);
        return true;
      }
    );
  });

  it("does not declare or accept service role keys in schema output", () => {
    const rawWithServiceKey = {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-string",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      SUPABASE_SERVICE_ROLE_KEY: "secret-service-role-key-never-allow",
    };

    const parsed = PublicSupabaseEnvSchema.parse(rawWithServiceKey);
    assert.equal("SUPABASE_SERVICE_ROLE_KEY" in parsed, false);
  });
});
