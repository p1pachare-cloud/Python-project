import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--stone-200)] bg-[var(--stone-50)]/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--mint-500)] font-mono text-lg font-bold text-[var(--mint-950)] shadow-[var(--shadow-subtle)]">
              Py
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[var(--stone-900)]">
                PyQuest
              </span>
              <span className="text-[11px] font-medium text-[var(--stone-500)] -mt-1">
                Gamified Python Learning
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-3" aria-label="Main Navigation">
            <Badge variant="mint" className="hidden sm:inline-flex">
              v0.1 Preview
            </Badge>
            <Button variant="secondary" size="sm">
              View Syllabus
            </Button>
            <Button variant="primary" size="sm">
              Start Free
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-[var(--stone-200)] py-16 sm:py-24" aria-labelledby="hero-heading">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-4 inline-flex items-center gap-2">
              <Badge variant="coral">
                Phase 2 Foundation
              </Badge>
              <span className="text-xs font-medium text-[var(--stone-600)]">
                Zero server-side execution cost
              </span>
            </div>
            <h1
              id="hero-heading"
              className="text-4xl font-extrabold tracking-tight text-[var(--stone-900)] sm:text-5xl lg:text-6xl"
            >
              Master Python by Writing Real Code
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--stone-600)] leading-relaxed">
              Bite-sized guided lessons, instant in-browser execution with Pyodide, and deliberate challenge practice. No command-line setup, no subscription walls, and no passive video watching.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Start Learning Now (Free)
              </Button>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Course 1 Syllabus
              </Button>
            </div>
            <p className="mt-3 text-xs text-[var(--stone-500)]">
              No credit card required. Works directly in modern web browsers.
            </p>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-white border-b border-[var(--stone-200)]" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="features-heading" className="text-2xl font-bold tracking-tight text-[var(--stone-900)] sm:text-3xl">
                Engineered for Deliberate Practice
              </h2>
              <p className="mt-2 text-sm text-[var(--stone-600)]">
                A learning loop designed to help beginners reason through problems independently.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--mint-100)] text-[var(--mint-950)] font-semibold">
                    01
                  </div>
                  <CardTitle>In-Browser Python</CardTitle>
                  <CardDescription>
                    Runs via Pyodide in a dedicated Web Worker. Your code executes instantly inside your browser tab without hitting a remote server.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-[var(--radius-sm)] bg-[var(--stone-100)] p-3 font-mono text-xs text-[var(--stone-800)]">
                    <code>print(&quot;Hello, PyQuest!&quot;)</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--coral-100)] text-[var(--coral-950)] font-semibold">
                    02
                  </div>
                  <CardTitle>Structured Curriculum</CardTitle>
                  <CardDescription>
                    From basic variables and loops to functions and data structures. Every lesson introduces one concept followed immediately by guided steps.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="neutral">Variables</Badge>
                    <Badge variant="neutral">Conditionals</Badge>
                    <Badge variant="neutral">Loops</Badge>
                    <Badge variant="neutral">Functions</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--mint-100)] text-[var(--mint-950)] font-semibold">
                    03
                  </div>
                  <CardTitle>Transparent Progress</CardTitle>
                  <CardDescription>
                    Earn XP, build consecutive day streaks, and unlock achievement badges. Progress is recorded in an append-only ledger designed for motivation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--stone-700)]">
                    <span className="flex h-6 items-center rounded-[var(--radius-sm)] bg-[var(--coral-100)] px-2 text-[var(--coral-950)]">
                      🔥 3-Day Streak
                    </span>
                    <span className="flex h-6 items-center rounded-[var(--radius-sm)] bg-[var(--mint-100)] px-2 text-[var(--mint-950)]">
                      ⚡ Level 2 Explorer
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Strip */}
        <section className="py-16 border-b border-[var(--stone-200)]" aria-labelledby="steps-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 id="steps-heading" className="text-center text-2xl font-bold tracking-tight text-[var(--stone-900)] mb-10">
              The Three-Minute Practice Loop
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--stone-200)] text-base font-bold text-[var(--stone-800)] mb-3">
                  1
                </span>
                <h3 className="text-base font-semibold text-[var(--stone-900)]">Read Concept</h3>
                <p className="mt-1 text-sm text-[var(--stone-600)] max-w-xs">
                  Bite-sized, jargon-free explanations with runnable syntax examples.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--stone-200)] text-base font-bold text-[var(--stone-800)] mb-3">
                  2
                </span>
                <h3 className="text-base font-semibold text-[var(--stone-900)]">Write Code</h3>
                <p className="mt-1 text-sm text-[var(--stone-600)] max-w-xs">
                  Solve exercises in the built-in Monaco code editor with syntax highlighting.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--stone-200)] text-base font-bold text-[var(--stone-800)] mb-3">
                  3
                </span>
                <h3 className="text-base font-semibold text-[var(--stone-900)]">Instant Feedback</h3>
                <p className="mt-1 text-sm text-[var(--stone-600)] max-w-xs">
                  Receive immediate practice check results, diff comparisons, and authored hints.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Course Preview */}
        <section className="py-16 bg-white border-b border-[var(--stone-200)]" aria-labelledby="course-heading">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[var(--radius-lg)] border border-[var(--stone-200)] bg-[var(--stone-50)] p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <Badge variant="mint" className="mb-2">Course 1</Badge>
                  <h2 id="course-heading" className="text-2xl font-bold text-[var(--stone-900)]">
                    Python Fundamentals
                  </h2>
                  <p className="text-sm text-[var(--stone-600)] mt-1">
                    Complete beginner track. Zero prior programming knowledge assumed.
                  </p>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-xs font-semibold text-[var(--stone-500)] uppercase tracking-wider block">Scope</span>
                  <span className="text-base font-bold text-[var(--stone-900)]">12 Lessons · 8 Challenges</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-white p-3.5 border border-[var(--stone-200)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[var(--stone-400)]">M01</span>
                    <span className="text-sm font-medium text-[var(--stone-900)]">First Steps (Output, Variables, Numbers)</span>
                  </div>
                  <span className="text-xs text-[var(--stone-500)] font-medium">4 Lessons</span>
                </div>
                <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-white p-3.5 border border-[var(--stone-200)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[var(--stone-400)]">M02</span>
                    <span className="text-sm font-medium text-[var(--stone-900)]">Logic &amp; Branching (Conditionals, Booleans)</span>
                  </div>
                  <span className="text-xs text-[var(--stone-500)] font-medium">4 Lessons</span>
                </div>
                <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-white p-3.5 border border-[var(--stone-200)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[var(--stone-400)]">M03</span>
                    <span className="text-sm font-medium text-[var(--stone-900)]">Functions &amp; Collections (Lists, Loops, Def)</span>
                  </div>
                  <span className="text-xs text-[var(--stone-500)] font-medium">4 Lessons · 8 Challenges</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Transparency & Integrity Note */}
        <section className="py-12 bg-[var(--stone-100)]" aria-labelledby="transparency-heading">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h3 id="transparency-heading" className="text-base font-semibold text-[var(--stone-900)]">
              Our Architectural Commitment to Learners
            </h3>
            <p className="mt-2 text-xs text-[var(--stone-600)] leading-relaxed max-w-2xl mx-auto">
              PyQuest exercises run locally in your browser for fast, forgiving practice. We explicitly distinguish browser practice checks from accredited grading. No third-party tracking cookies or behavioral advertising are permitted on this platform.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--stone-200)] bg-[var(--stone-50)] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--stone-500)]">
          <p>© 2026 PyQuest. Built with Next.js, TypeScript, and Pyodide.</p>
          <div className="flex items-center gap-4">
            <span className="hover:underline cursor-pointer">Privacy Outline</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Terms Outline</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Design System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
