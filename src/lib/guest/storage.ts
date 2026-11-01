import { z } from "zod";

/**
 * PyQuest Guest Mode Local Storage Architecture
 * 
 * Strict Privacy Mandates:
 * 1. Zero network transmission of learner-authored code, execution outputs, drafts,
 *    XP rewards, or streak counts. All state resides exclusively in the browser's localStorage.
 * 2. Never store authentication tokens, email addresses, or personal identifiers in guest storage.
 * 3. SSR-safe execution: All localStorage interactions guard against server execution.
 */

export const GUEST_STORAGE_KEY = "pyquest_guest_progress";

export const GuestChallengeCompletionSchema = z.object({
  challengeId: z.string(),
  completedAt: z.string().datetime(),
  xp: z.number().int().nonnegative(),
});

export const GuestDraftSchema = z.object({
  code: z.string(),
  updatedAt: z.string().datetime(),
});

export const GuestStatsSchema = z.object({
  totalXp: z.number().int().nonnegative().default(0),
  streakDays: z.number().int().nonnegative().default(0),
  lastActiveDate: z.string().nullable().default(null),
});

export const GuestProgressSchema = z.object({
  version: z.literal(1).default(1),
  completedChallenges: z.array(GuestChallengeCompletionSchema).default([]),
  drafts: z.record(z.string(), GuestDraftSchema).default({}),
  stats: GuestStatsSchema.default({ totalXp: 0, streakDays: 0, lastActiveDate: null }),
});

export type GuestChallengeCompletion = z.infer<typeof GuestChallengeCompletionSchema>;
export type GuestDraft = z.infer<typeof GuestDraftSchema>;
export type GuestStats = z.infer<typeof GuestStatsSchema>;
export type GuestProgress = z.infer<typeof GuestProgressSchema>;

const DEFAULT_GUEST_PROGRESS: GuestProgress = {
  version: 1,
  completedChallenges: [],
  drafts: {},
  stats: {
    totalXp: 0,
    streakDays: 0,
    lastActiveDate: null,
  },
};

function isClient(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Loads the current guest progress from localStorage.
 * Returns default empty state if running on server or if data is missing/corrupted.
 */
export function getGuestProgress(): GuestProgress {
  if (!isClient()) {
    return DEFAULT_GUEST_PROGRESS;
  }

  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_GUEST_PROGRESS;
    }

    const parsed = JSON.parse(raw);
    const result = GuestProgressSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    console.warn("[PyQuest Guest Storage] Malformed guest progress payload; resetting to default.");
    return DEFAULT_GUEST_PROGRESS;
  } catch (err) {
    console.error("[PyQuest Guest Storage] Failed to read from localStorage:", err);
    return DEFAULT_GUEST_PROGRESS;
  }
}

/**
 * Saves the given guest progress object to localStorage.
 */
export function saveGuestProgress(progress: GuestProgress): void {
  if (!isClient()) return;

  try {
    const validated = GuestProgressSchema.parse(progress);
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(validated));
  } catch (err) {
    console.error("[PyQuest Guest Storage] Failed to write to localStorage:", err);
  }
}

/**
 * Retrieves the saved code draft for a given challenge.
 */
export function getGuestChallengeDraft(challengeId: string): string | null {
  const progress = getGuestProgress();
  return progress.drafts[challengeId]?.code ?? null;
}

/**
 * Saves a code draft for a given challenge.
 */
export function saveGuestChallengeDraft(challengeId: string, code: string): void {
  const progress = getGuestProgress();
  const updated: GuestProgress = {
    ...progress,
    drafts: {
      ...progress.drafts,
      [challengeId]: {
        code,
        updatedAt: new Date().toISOString(),
      },
    },
  };
  saveGuestProgress(updated);
}

/**
 * Records a challenge completion in Guest Mode and updates personal XP.
 * If the challenge was already completed, XP is not re-awarded.
 */
export function recordGuestChallengeCompletion(challengeId: string, xp: number): {
  alreadyCompleted: boolean;
  totalXp: number;
} {
  const progress = getGuestProgress();
  const existing = progress.completedChallenges.find((c) => c.challengeId === challengeId);

  if (existing) {
    return {
      alreadyCompleted: true,
      totalXp: progress.stats.totalXp,
    };
  }

  const newTotalXp = progress.stats.totalXp + xp;
  const today = new Date().toISOString().slice(0, 10);
  const updated: GuestProgress = {
    ...progress,
    completedChallenges: [
      ...progress.completedChallenges,
      {
        challengeId,
        completedAt: new Date().toISOString(),
        xp,
      },
    ],
    stats: {
      ...progress.stats,
      totalXp: newTotalXp,
      lastActiveDate: today,
    },
  };

  saveGuestProgress(updated);
  return {
    alreadyCompleted: false,
    totalXp: newTotalXp,
  };
}

/**
 * Clears all guest progress from localStorage.
 * Used during account migration or explicit user reset.
 */
export function clearGuestProgress(): void {
  if (!isClient()) return;
  try {
    window.localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch (err) {
    console.error("[PyQuest Guest Storage] Failed to clear localStorage:", err);
  }
}
