import React from "react";
import { notFound } from "next/navigation";
import { getAllChallenges, getChallenge } from "@/lib/content/loader";
import { ChallengeWorkspace } from "./ChallengeWorkspace";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  const challenges = getAllChallenges();
  return challenges.map(({ challenge }) => ({
    slug: challenge.slug,
  }));
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const challengeData = getChallenge(slug);

  if (!challengeData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--stone-50)]">
      {/* Header */}
      <header className="border-b border-[var(--stone-200)] bg-white py-3.5 px-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--mint-500)] font-mono text-sm font-bold text-[var(--mint-950)]">
              Py
            </span>
            <span className="font-bold text-[var(--stone-900)]">PyQuest</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/challenges">
              <Button variant="secondary" size="sm">
                Challenges
              </Button>
            </Link>
            <Link href={`/courses/${challengeData.courseSlug}`}>
              <Button variant="ghost" size="sm">
                Course Track
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main id="main-content">
        <ChallengeWorkspace
          challenge={challengeData.challenge}
          courseSlug={challengeData.courseSlug}
          moduleSlug={challengeData.moduleSlug}
        />
      </main>
    </div>
  );
}
