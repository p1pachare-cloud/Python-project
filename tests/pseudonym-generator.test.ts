import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ADJECTIVES,
  ANIMALS,
  generatePseudonym,
  generateUuidFallback,
  isValidDisplayName,
} from "../src/lib/auth/pseudonyms.ts";

describe("Pseudonym Generator & Utilities", () => {
  it("contains exactly 20 adjectives and 20 animals matching SQL specification", () => {
    assert.equal(ADJECTIVES.length, 20);
    assert.equal(ANIMALS.length, 20);
    assert.equal(ADJECTIVES[0], "Swift");
    assert.equal(ANIMALS[0], "Fox");
    assert.equal(ADJECTIVES[19], "Zealous");
    assert.equal(ANIMALS[19], "Lemur");
  });

  it("generates a valid pseudonym conforming to display name rules", () => {
    for (let i = 0; i < 50; i++) {
      const name = generatePseudonym();
      assert.ok(isValidDisplayName(name), `Generated name ${name} should be valid`);
      const parts = name.split("_");
      assert.equal(parts.length, 3, "Name must have 3 parts: Adjective_Animal_####");
      assert.ok(ADJECTIVES.includes(parts[0]));
      assert.ok(ANIMALS.includes(parts[1]));
      assert.equal(parts[2].length, 4, "Number suffix must be zero-padded 4 digits");
    }
  });

  it("produces deterministic output when given controlled PRNG input", () => {
    // Inject deterministic random values: 0 -> first element, 0.999 -> last element
    const mockZero = () => 0;
    assert.equal(generatePseudonym(mockZero), "Swift_Fox_0000");

    const mockMax = () => 0.99999;
    assert.equal(generatePseudonym(mockMax), "Zealous_Lemur_9999");
  });

  it("generates exact 24-character UUID fallback", () => {
    const sampleUuid = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const fallback = generateUuidFallback(sampleUuid);

    assert.equal(fallback, "Coder_dddddddddddddddddd");
    assert.equal(fallback.length, 24, "Fallback must be exactly 24 characters");
    assert.ok(isValidDisplayName(fallback), "Fallback must satisfy display name regex");
  });
});
