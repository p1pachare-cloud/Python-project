import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  GUEST_STORAGE_KEY,
  getGuestProgress,
  saveGuestChallengeDraft,
  getGuestChallengeDraft,
  recordGuestChallengeCompletion,
  clearGuestProgress,
  GuestProgressSchema,
} from "../src/lib/guest/storage.ts";

// Mock localStorage in Node.js environment
const mockStorage = new Map<string, string>();

(globalThis as unknown as { window: { localStorage: Storage } }).window = {
  localStorage: {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, value: string) => { mockStorage.set(key, value); },
    removeItem: (key: string) => { mockStorage.delete(key); },
    clear: () => { mockStorage.clear(); },
    key: (index: number) => Array.from(mockStorage.keys())[index] ?? null,
    length: 0,
  } as Storage,
};

describe("Guest Mode Local Storage", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("returns default empty progress when storage is unpopulated", () => {
    const progress = getGuestProgress();
    assert.equal(progress.version, 1);
    assert.deepEqual(progress.completedChallenges, []);
    assert.deepEqual(progress.drafts, {});
    assert.equal(progress.stats.totalXp, 0);
    assert.equal(progress.stats.streakDays, 0);
    assert.equal(progress.stats.lastActiveDate, null);
  });

  it("saves and retrieves a challenge code draft", () => {
    const challengeId = "01-first-steps/01-say-hello";
    const code = "print('Hello, Python!')\n";

    saveGuestChallengeDraft(challengeId, code);

    const retrieved = getGuestChallengeDraft(challengeId);
    assert.equal(retrieved, code);

    const progress = getGuestProgress();
    assert.ok(progress.drafts[challengeId]);
    assert.equal(progress.drafts[challengeId].code, code);
  });

  it("records challenge completion and increments XP accurately", () => {
    const challengeId = "01-first-steps/01-say-hello";
    const result1 = recordGuestChallengeCompletion(challengeId, 25);

    assert.equal(result1.alreadyCompleted, false);
    assert.equal(result1.totalXp, 25);

    const progress = getGuestProgress();
    assert.equal(progress.completedChallenges.length, 1);
    assert.equal(progress.completedChallenges[0].challengeId, challengeId);
    assert.equal(progress.completedChallenges[0].xp, 25);
    assert.equal(progress.stats.totalXp, 25);

    // Completing a second challenge accumulates XP
    const result2 = recordGuestChallengeCompletion("01-first-steps/02-variables", 50);
    assert.equal(result2.alreadyCompleted, false);
    assert.equal(result2.totalXp, 75);
  });

  it("prevents double-awarding of XP for re-running already completed challenge", () => {
    const challengeId = "01-first-steps/01-say-hello";
    recordGuestChallengeCompletion(challengeId, 25);

    const secondAttempt = recordGuestChallengeCompletion(challengeId, 25);
    assert.equal(secondAttempt.alreadyCompleted, true);
    assert.equal(secondAttempt.totalXp, 25);

    const progress = getGuestProgress();
    assert.equal(progress.completedChallenges.length, 1);
    assert.equal(progress.stats.totalXp, 25);
  });

  it("resets to default gracefully if stored JSON is corrupt or invalid", () => {
    mockStorage.set(GUEST_STORAGE_KEY, "{ invalid json corrupt");
    const progress = getGuestProgress();
    assert.equal(progress.stats.totalXp, 0);

    mockStorage.set(GUEST_STORAGE_KEY, JSON.stringify({ version: 999, invalidField: true }));
    const progressSchemaMismatch = getGuestProgress();
    assert.equal(progressSchemaMismatch.version, 1);
  });

  it("clears all guest progress on explicit reset", () => {
    saveGuestChallengeDraft("c1", "test code");
    recordGuestChallengeCompletion("c1", 30);
    assert.equal(mockStorage.has(GUEST_STORAGE_KEY), true);

    clearGuestProgress();
    assert.equal(mockStorage.has(GUEST_STORAGE_KEY), false);

    const progress = getGuestProgress();
    assert.equal(progress.stats.totalXp, 0);
  });

  it("validates compliant GuestProgressSchema directly", () => {
    const valid = {
      version: 1,
      completedChallenges: [
        {
          challengeId: "test-c1",
          completedAt: new Date().toISOString(),
          xp: 15,
        },
      ],
      drafts: {
        "test-c1": {
          code: "x = 42",
          updatedAt: new Date().toISOString(),
        },
      },
      stats: {
        totalXp: 15,
        streakDays: 1,
        lastActiveDate: "2026-11-01",
      },
    };

    const parsed = GuestProgressSchema.safeParse(valid);
    assert.equal(parsed.success, true);
  });
});
