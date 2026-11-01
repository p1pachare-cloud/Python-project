import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DisplayNameSchema,
  AgeDeclarationSchema,
  SignupMetadataSchema,
  LoginCredentialsSchema,
} from "../src/lib/auth/schemas.ts";

describe("Authentication Schemas & Validation", () => {
  describe("DisplayNameSchema", () => {
    it("accepts valid alphanumeric display names within 3 to 24 chars", () => {
      assert.equal(DisplayNameSchema.parse("Swift_Fox_0421"), "Swift_Fox_0421");
      assert.equal(DisplayNameSchema.parse("Coder_123"), "Coder_123");
      assert.equal(DisplayNameSchema.parse("abc"), "abc");
      assert.equal(DisplayNameSchema.parse("A".repeat(24)), "A".repeat(24));
    });

    it("rejects names shorter than 3 characters", () => {
      assert.throws(() => DisplayNameSchema.parse("ab"), /at least 3 characters/);
    });

    it("rejects names longer than 24 characters", () => {
      assert.throws(() => DisplayNameSchema.parse("A".repeat(25)), /cannot exceed 24 characters/);
    });

    it("rejects names with spaces or special characters", () => {
      assert.throws(() => DisplayNameSchema.parse("Swift Fox"), /can only contain letters, numbers, and underscores/);
      assert.throws(() => DisplayNameSchema.parse("Coder!"), /can only contain letters, numbers, and underscores/);
      assert.throws(() => DisplayNameSchema.parse("user@name"), /can only contain letters, numbers, and underscores/);
    });
  });

  describe("AgeDeclarationSchema", () => {
    it("accepts explicit literal '18+' declaration", () => {
      assert.equal(AgeDeclarationSchema.parse("18+"), "18+");
    });

    it("rejects non-adult declarations", () => {
      assert.throws(() => AgeDeclarationSchema.parse("under_18"));
      assert.throws(() => AgeDeclarationSchema.parse("17"));
      assert.throws(() => AgeDeclarationSchema.parse(null));
    });
  });

  describe("SignupMetadataSchema", () => {
    it("validates compliant signup metadata", () => {
      const valid = {
        age_declaration: "18+",
        display_name: "Python_Pro_99",
        avatar_id: "default_coder",
        timezone: "Asia/Kolkata",
      };
      const parsed = SignupMetadataSchema.parse(valid);
      assert.equal(parsed.age_declaration, "18+");
      assert.equal(parsed.display_name, "Python_Pro_99");
      assert.equal(parsed.timezone, "Asia/Kolkata");
    });

    it("rejects metadata with missing or invalid age declaration", () => {
      assert.throws(() => SignupMetadataSchema.parse({ age_declaration: "minor" }));
      assert.throws(() => SignupMetadataSchema.parse({}));
    });
  });

  describe("LoginCredentialsSchema", () => {
    it("validates compliant login credentials", () => {
      const creds = { email: "test@example.com", password: "Password123!" };
      const parsed = LoginCredentialsSchema.parse(creds);
      assert.equal(parsed.email, "test@example.com");
      assert.equal(parsed.password, "Password123!");
    });

    it("rejects invalid emails", () => {
      assert.throws(() => LoginCredentialsSchema.parse({ email: "invalid-email", password: "Password123!" }), /valid email/);
    });

    it("rejects passwords shorter than 8 characters", () => {
      assert.throws(() => LoginCredentialsSchema.parse({ email: "test@example.com", password: "short" }), /at least 8 characters/);
    });

    it("accepts ordinary ASCII passwords up to 72 bytes", () => {
      const ascii72 = "A".repeat(72);
      assert.equal(new TextEncoder().encode(ascii72).length, 72);
      const parsed = LoginCredentialsSchema.parse({ email: "test@example.com", password: ascii72 });
      assert.equal(parsed.password, ascii72);
    });

    it("rejects ASCII passwords exceeding 72 bytes", () => {
      const ascii73 = "A".repeat(73);
      assert.throws(
        () => LoginCredentialsSchema.parse({ email: "test@example.com", password: ascii73 }),
        /cannot exceed 72 UTF-8 bytes/
      );
    });

    it("accepts multi-byte UTF-8 passwords up to 72 bytes", () => {
      // 'é' is 2 bytes in UTF-8. 36 * 2 = 72 bytes.
      const multiByte72 = "é".repeat(36);
      assert.equal(new TextEncoder().encode(multiByte72).length, 72);
      const parsed = LoginCredentialsSchema.parse({ email: "test@example.com", password: multiByte72 });
      assert.equal(parsed.password, multiByte72);
    });

    it("rejects multi-byte UTF-8 passwords exceeding 72 bytes even if character count is low", () => {
      // 37 * 2 = 74 bytes (only 37 JS characters)
      const multiByte74 = "é".repeat(37);
      assert.equal(new TextEncoder().encode(multiByte74).length, 74);
      assert.throws(
        () => LoginCredentialsSchema.parse({ email: "test@example.com", password: multiByte74 }),
        /cannot exceed 72 UTF-8 bytes/
      );
    });

    it("accepts emoji-containing passwords up to 72 bytes", () => {
      // '🔒' is 4 bytes in UTF-8. 18 * 4 = 72 bytes.
      const emoji72 = "🔒".repeat(18);
      assert.equal(new TextEncoder().encode(emoji72).length, 72);
      const parsed = LoginCredentialsSchema.parse({ email: "test@example.com", password: emoji72 });
      assert.equal(parsed.password, emoji72);
    });

    it("rejects emoji-containing passwords exceeding 72 bytes", () => {
      // 19 * 4 = 76 bytes (only 19 emoji symbols)
      const emoji76 = "🔒".repeat(19);
      assert.equal(new TextEncoder().encode(emoji76).length, 76);
      assert.throws(
        () => LoginCredentialsSchema.parse({ email: "test@example.com", password: emoji76 }),
        /cannot exceed 72 UTF-8 bytes/
      );
    });
  });
});
