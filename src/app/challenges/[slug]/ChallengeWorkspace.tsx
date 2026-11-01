"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type Challenge } from "@/lib/content/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor/CodeEditor";
import {
  getGuestChallengeDraft,
  saveGuestChallengeDraft,
  recordGuestChallengeCompletion,
} from "@/lib/guest/storage";

export interface ChallengeWorkspaceProps {
  challenge: Challenge;
  courseSlug: string;
  moduleSlug: string;
}

export function ChallengeWorkspace({
  challenge,
  courseSlug,
}: ChallengeWorkspaceProps) {
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [challengePassed, setChallengePassed] = useState<boolean>(false);
  const [activeDraft, setActiveDraft] = useState<string>(() => {
    return getGuestChallengeDraft(challenge.id) ?? challenge.starterCode;
  });

  const handleRevealHint = () => {
    if (revealedHints < challenge.hints.length) {
      setRevealedHints((prev) => prev + 1);
    }
  };

  const allTests = [...challenge.visibleTests, ...challenge.additionalChecks];

  const diffVariant =
    challenge.difficulty === "easy"
      ? "mint"
      : challenge.difficulty === "medium"
      ? "warning"
      : "coral";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs text-[var(--stone-500)]">
        <Link href="/challenges" className="hover:text-[var(--stone-900)] hover:underline">
          Challenges
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--stone-800)]">{challenge.title}</span>
      </nav>

      {/* Two-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Problem Statement & Hints */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[var(--radius-lg)] border border-[var(--stone-200)] bg-white p-6 shadow-[var(--shadow-subtle)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Badge variant={diffVariant} className="capitalize">
                  {challenge.difficulty}
                </Badge>
                <span className="text-xs font-bold text-[var(--mint-700)]">
                  +{challenge.xp} XP
                </span>
              </div>
              <span className="text-xs text-[var(--stone-500)]">
                Tier A Practice Check
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-[var(--stone-900)]">
              {challenge.title}
            </h1>

            {/* Problem Statement */}
            <div className="mt-4 text-sm text-[var(--stone-800)] leading-relaxed whitespace-pre-wrap">
              {challenge.statement}
            </div>

            {/* Examples */}
            <div className="mt-6 border-t border-[var(--stone-200)] pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--stone-600)] block mb-2">
                Examples
              </span>
              <div className="space-y-3">
                {challenge.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-[var(--radius-sm)] border border-[var(--stone-200)] bg-[var(--stone-50)] p-3 text-xs font-mono"
                  >
                    <div><span className="text-[var(--stone-500)]">Input:</span> {ex.input}</div>
                    <div className="font-bold text-[var(--stone-900)]"><span className="text-[var(--stone-500)]">Output:</span> {ex.output}</div>
                    {ex.explanation && (
                      <div className="mt-1 text-[11px] text-[var(--stone-600)] font-sans italic">
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 flex flex-wrap gap-1.5 border-t border-[var(--stone-200)] pt-4">
              {challenge.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[var(--radius-sm)] bg-[var(--stone-100)] px-2 py-0.5 text-xs text-[var(--stone-700)] font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Progressive Hints Drawer */}
          {challenge.hints.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--stone-200)] bg-white p-6 shadow-[var(--shadow-subtle)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--stone-700)]">
                  Progressive Hints (Free)
                </span>
                {revealedHints < challenge.hints.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRevealHint}
                  >
                    💡 Reveal Hint ({revealedHints + 1}/{challenge.hints.length})
                  </Button>
                )}
              </div>

              {revealedHints === 0 && (
                <p className="text-xs text-[var(--stone-500)] italic">
                  Need a nudge? Hints are free and will not deduct any XP.
                </p>
              )}

              {revealedHints > 0 && (
                <div className="space-y-2" aria-live="polite">
                  {challenge.hints.slice(0, revealedHints).map((hint, idx) => (
                    <div
                      key={idx}
                      className="rounded-[var(--radius-sm)] bg-[var(--mint-50)] border border-[var(--mint-200)] p-3 text-xs text-[var(--mint-950)]"
                    >
                      <span className="font-bold mr-1.5">Hint {idx + 1}:</span>
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Practice Check Disclaimer */}
          <div className="rounded-[var(--radius-sm)] bg-[var(--stone-100)] p-3 text-xs text-[var(--stone-600)] border border-[var(--stone-200)] leading-relaxed">
            <span className="font-semibold text-[var(--stone-800)]">Architectural Disclaimer:</span> All challenge checks run inside your local browser Web Worker. Tests and outputs are not cryptographically hidden. In Phase 7, passing claims are recorded to an append-only server ledger as self-reported completions.
          </div>
        </div>

        {/* Right Column: Code Editor & Runner */}
        <div className="lg:col-span-7 space-y-4">
          <CodeEditor
            key={`${challenge.id}-${activeDraft.length}`}
            initialCode={activeDraft}
            tests={allTests}
            title={`Challenge: ${challenge.title}`}
            onCodeChange={(newCode) => {
              setActiveDraft(newCode);
              saveGuestChallengeDraft(challenge.id, newCode);
            }}
            onRunComplete={(allPassed) => {
              setChallengePassed(allPassed);
              if (allPassed) {
                recordGuestChallengeCompletion(challenge.id, challenge.xp);
              }
            }}
          />

          {/* Pass Banner */}
          {challengePassed && (
            <div
              className="rounded-[var(--radius-md)] border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 shadow-[var(--shadow-card)]"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-lg">
                    🏆
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-emerald-950">
                      Challenge Solved!
                    </h3>
                    <p className="text-xs text-emerald-800">
                      All {allTests.length} practice checks passed in the Pyodide Web Worker.
                    </p>
                  </div>
                </div>
                <Badge variant="mint">+{challenge.xp} XP Self-Reported</Badge>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link href="/challenges">
              <Button variant="secondary" size="sm">
                ← All Challenges
              </Button>
            </Link>
            <Link href={`/courses/${courseSlug}`}>
              <Button variant="ghost" size="sm">
                Back to Course Map
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
