import { DISPLAY_NAME_REGEX } from "./schemas.ts";

/**
 * Production Adjectives (20 elements)
 * Source of truth: AGENTS.md Section 3.5 & Database Trigger Specification
 */
export const ADJECTIVES: readonly string[] = [
  "Swift", "Bright", "Clever", "Agile", "Bold",
  "Brave", "Curious", "Eager", "Fierce", "Gentle",
  "Happy", "Keen", "Lively", "Mighty", "Nimble",
  "Quick", "Rustic", "Silent", "Wise", "Zealous"
] as const;

/**
 * Production Animals (20 elements)
 * Source of truth: AGENTS.md Section 3.5 & Database Trigger Specification
 */
export const ANIMALS: readonly string[] = [
  "Fox", "Owl", "Panda", "Tiger", "Bear",
  "Falcon", "Wolf", "Otter", "Dolphin", "Eagle",
  "Hawk", "Koala", "Lynx", "Panther", "Raven",
  "Seal", "Badger", "Cheetah", "Gecko", "Lemur"
] as const;

/**
 * Validates a display name against the platform rules (3-24 alphanumeric or underscore).
 */
export function isValidDisplayName(name: string): boolean {
  return DISPLAY_NAME_REGEX.test(name.trim());
}

/**
 * Generates a candidate pseudonym using the production format:
 * Adjective_Animal_#### (e.g. Swift_Fox_0421)
 */
export function generatePseudonym(
  randomFn: () => number = Math.random
): string {
  const adjIndex = Math.floor(randomFn() * ADJECTIVES.length);
  const animalIndex = Math.floor(randomFn() * ANIMALS.length);
  const num = Math.floor(randomFn() * 10000);
  const paddedNum = num.toString().padStart(4, "0");

  return `${ADJECTIVES[adjIndex]}_${ANIMALS[animalIndex]}_${paddedNum}`;
}

/**
 * Generates the deterministic 24-character UUID fallback:
 * 'Coder_' (6 chars) + 18 hex characters of the UUID without hyphens = 24 chars.
 */
export function generateUuidFallback(userId: string): string {
  const cleanUuid = userId.replace(/-/g, "");
  const suffix = cleanUuid.substring(0, 18);
  return `Coder_${suffix}`;
}
