import React from "react";
import Link from "next/link";
import { getAllChallenges } from "@/lib/content/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ChallengesPage() {
  const challenges = getAllChallenges();

  return (
    <div className="min-h-screen bg-[var(--stone-50)]">
      {/* Navigation Header */}
      <header className="border-b border-[var(--stone-200)] bg-white py-4 px-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--mint-500)] font-mono text-sm font-bold text-[var(--mint-950)]">
              Py
            </span>
            <span className="font-bold text-[var(--stone-900)]">PyQuest</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/courses/python-basics">
              <Button variant="ghost" size="sm">
                Course Track
              </Button>
            </Link>
            <Link href="/">
              <Button variant="secondary" size="sm">
                ← Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="coral">Practice Challenges</Badge>
            <span className="text-xs text-[var(--stone-500)]">
              Untrusted Practice Check (Tier A)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--stone-900)]">
            Coding Challenges
          </h1>
          <p className="mt-2 text-base text-[var(--stone-600)]">
            Test your Python skills with standalone algorithm and problem-solving exercises.
          </p>
        </div>

        {/* Challenge List */}
        <div className="grid grid-cols-1 gap-4">
          {challenges.map(({ challenge, courseSlug, moduleSlug }) => {
            const diffVariant =
              challenge.difficulty === "easy"
                ? "mint"
                : challenge.difficulty === "medium"
                ? "warning"
                : "coral";

            return (
              <Card key={challenge.id} className="transition-colors hover:border-[var(--mint-400)]">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={diffVariant} className="capitalize">
                        {challenge.difficulty}
                      </Badge>
                      <span className="text-xs font-semibold text-[var(--mint-700)]">
                        +{challenge.xp} XP
                      </span>
                    </div>
                    <span className="text-xs text-[var(--stone-500)] font-mono">
                      {courseSlug}/{moduleSlug}
                    </span>
                  </div>
                  <CardTitle className="text-lg">
                    {challenge.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {challenge.statement}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--stone-100)]">
                    <div className="flex flex-wrap gap-1.5">
                      {challenge.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-[var(--radius-sm)] bg-[var(--stone-100)] px-2 py-0.5 text-xs text-[var(--stone-700)] font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/courses/${courseSlug}`}>
                        <Button variant="secondary" size="sm">
                          Course Map
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
