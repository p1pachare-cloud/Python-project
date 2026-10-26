"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type Lesson, type Block } from "@/lib/content/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeEditor } from "@/components/editor/CodeEditor";

export interface LessonRendererProps {
  lesson: Lesson;
  courseSlug: string;
  moduleSlug: string;
}

export function LessonRenderer({
  lesson,
  courseSlug,
  moduleSlug,
}: LessonRendererProps) {
  // Client state for hints
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [exercisePassed, setExercisePassed] = useState<boolean>(false);

  // Client state for quizzes (blockIndex -> selectedOptionIndex)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const handleRevealHint = () => {
    if (lesson.exercise && revealedHints < lesson.exercise.hints.length) {
      setRevealedHints((prev) => prev + 1);
    }
  };

  const handleSelectQuiz = (blockIndex: number, optionIndex: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [blockIndex]: optionIndex,
    }));
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs text-[var(--stone-500)]">
        <Link href={`/courses/${courseSlug}`} className="hover:text-[var(--stone-900)] hover:underline">
          Course Path
        </Link>
        <span>/</span>
        <span className="capitalize">{moduleSlug.replace(/-/g, " ")}</span>
        <span>/</span>
        <span className="font-semibold text-[var(--stone-800)]">{lesson.title}</span>
      </nav>

      {/* Lesson Header */}
      <header className="mb-8 border-b border-[var(--stone-200)] pb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="mint">Lesson</Badge>
          <span className="text-xs text-[var(--stone-500)]">⏱ ~{lesson.estimatedMinutes} min read</span>
          {lesson.exercise && (
            <Badge variant="coral">+{lesson.exercise.xp} XP Available</Badge>
          )}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--stone-900)] sm:text-4xl">
          {lesson.title}
        </h1>

        {/* Learning Objectives */}
        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--stone-100)] p-4 border border-[var(--stone-200)]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--stone-600)] mb-2">
            Learning Objectives
          </h2>
          <ul className="space-y-1 text-sm text-[var(--stone-800)]">
            {lesson.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--mint-700)] font-bold">✓</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Body Content Blocks */}
      <div className="space-y-6 mb-12">
        {lesson.body.map((block: Block, index: number) => {
          switch (block.kind) {
            case "markdown":
              return (
                <div
                  key={index}
                  className="text-base text-[var(--stone-800)] leading-relaxed space-y-3"
                >
                  <p>{block.content}</p>
                </div>
              );

            case "codeExample":
              return (
                <figure key={index} className="my-4">
                  <div className="rounded-[var(--radius-md)] bg-[var(--editor-bg)] p-4 font-mono text-sm text-[var(--editor-text)] shadow-[var(--shadow-subtle)] overflow-x-auto">
                    <pre>
                      <code>{block.code}</code>
                    </pre>
                  </div>
                  {block.caption && (
                    <figcaption className="mt-1.5 text-xs text-[var(--stone-500)] italic">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );

            case "callout": {
              const borderStyles = {
                info: "border-l-4 border-l-[var(--semantic-info)] bg-teal-50/50",
                warning: "border-l-4 border-l-[var(--semantic-warning)] bg-amber-50/50",
                tip: "border-l-4 border-l-[var(--mint-600)] bg-[var(--mint-50)]",
              };
              return (
                <aside
                  key={index}
                  className={`rounded-r-[var(--radius-md)] p-4 my-4 ${borderStyles[block.type]}`}
                  role="note"
                >
                  {block.title && (
                    <h3 className="text-sm font-bold text-[var(--stone-900)] mb-1">
                      {block.title}
                    </h3>
                  )}
                  <p className="text-sm text-[var(--stone-800)] leading-relaxed">
                    {block.text}
                  </p>
                </aside>
              );
            }

            case "quiz": {
              const selected = quizAnswers[index];
              const isAnswered = selected !== undefined;
              const isCorrect = isAnswered && selected === block.answerIndex;

              return (
                <Card key={index} className="my-6">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="mint">Quick Knowledge Check</Badge>
                    </div>
                    <CardTitle className="text-base font-semibold">
                      {block.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2" role="radiogroup" aria-label={block.question}>
                      {block.options.map((option, optIdx) => {
                        const isThisSelected = selected === optIdx;
                        let optionStyle = "border-[var(--stone-200)] bg-white hover:bg-[var(--stone-100)]";

                        if (isAnswered) {
                          if (optIdx === block.answerIndex) {
                            optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-medium";
                          } else if (isThisSelected) {
                            optionStyle = "border-rose-400 bg-rose-50 text-rose-950";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            role="radio"
                            aria-checked={isThisSelected}
                            onClick={() => handleSelectQuiz(index, optIdx)}
                            className={`w-full text-left rounded-[var(--radius-md)] border p-3 text-sm transition-colors cursor-pointer flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{option}</span>
                            {isAnswered && optIdx === block.answerIndex && (
                              <span className="text-emerald-700 font-bold text-xs">✓ Correct</span>
                            )}
                            {isAnswered && isThisSelected && optIdx !== block.answerIndex && (
                              <span className="text-rose-700 font-bold text-xs">✗ Incorrect</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div
                        className={`mt-4 rounded-[var(--radius-sm)] p-3 text-xs leading-relaxed ${
                          isCorrect ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-amber-50 text-amber-900 border border-amber-200"
                        }`}
                        aria-live="polite"
                      >
                        <p className="font-semibold mb-0.5">
                          {isCorrect ? "Great job!" : "Review note:"}
                        </p>
                        {block.explanation && <p>{block.explanation}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }
          }
        })}
      </div>

      {/* Exercise Section */}
      {lesson.exercise && (
        <section
          className="mb-12 rounded-[var(--radius-lg)] border-2 border-[var(--mint-500)]/40 bg-white p-6 shadow-[var(--shadow-card)]"
          aria-labelledby="exercise-heading"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--stone-200)] pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="mint">Coding Exercise</Badge>
                <span className="text-xs font-semibold text-[var(--mint-700)]">
                  +{lesson.exercise.xp} XP
                </span>
              </div>
              <h2 id="exercise-heading" className="text-xl font-bold text-[var(--stone-900)]">
                Put Concept into Practice
              </h2>
            </div>
            <span className="text-xs text-[var(--stone-500)]">
              Practice Check (Tier A)
            </span>
          </div>

          {/* Exercise Instructions */}
          <div className="text-sm text-[var(--stone-800)] leading-relaxed mb-5">
            <p>{lesson.exercise.instructions}</p>
          </div>

          {/* Interactive Code Editor (Phase 4 Pyodide + Monaco) */}
          <div className="mb-6">
            <CodeEditor
              initialCode={lesson.exercise.starterCode}
              tests={lesson.exercise.visibleTests}
              title={`Exercise: ${lesson.title}`}
              onRunComplete={(allPassed) => {
                setExercisePassed(allPassed);
              }}
            />
          </div>

          {/* Practice Check Completion Banner */}
          {exercisePassed && (
            <div
              className="mb-6 rounded-[var(--radius-md)] border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[var(--shadow-subtle)]"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-lg">
                  ✓
                </span>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950">
                    Practice Check Passed!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    All visible tests passed inside your browser Web Worker (Tier A).
                  </p>
                </div>
              </div>
              <Badge variant="mint">
                +{lesson.exercise.xp} XP Self-Reported
              </Badge>
            </div>
          )}

          {/* Hints Section */}
          {lesson.exercise.hints.length > 0 && (
            <div className="border-t border-[var(--stone-200)] pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[var(--stone-700)]">
                  Progressive Hints (Free of XP cost)
                </span>
                {revealedHints < lesson.exercise.hints.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRevealHint}
                  >
                    💡 Reveal Hint ({revealedHints + 1}/{lesson.exercise.hints.length})
                  </Button>
                )}
              </div>

              {revealedHints > 0 && (
                <div className="space-y-2" aria-live="polite">
                  {lesson.exercise.hints.slice(0, revealedHints).map((hint, hIdx) => (
                    <div
                      key={hIdx}
                      className="rounded-[var(--radius-sm)] bg-[var(--mint-50)] border border-[var(--mint-200)] p-3 text-xs text-[var(--mint-950)]"
                    >
                      <span className="font-bold mr-1.5">Hint {hIdx + 1}:</span>
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Execution Environment Notice */}
          <div className="mt-5 rounded-[var(--radius-sm)] bg-[var(--stone-100)] p-3 text-center text-xs text-[var(--stone-600)] border border-[var(--stone-200)]">
            <span className="font-semibold text-[var(--stone-800)]">Browser Execution Note:</span> Python code executes directly in your browser tab via a Web Worker (Tier A, Untrusted). No learner code is sent to or executed on the server.
          </div>
        </section>
      )}

      {/* Lesson Navigation Footer */}
      <footer className="border-t border-[var(--stone-200)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {lesson.prev ? (
          <Link href={`/courses/${courseSlug}/${moduleSlug}/${lesson.prev}`}>
            <Button variant="secondary" size="md">
              ← Previous Lesson
            </Button>
          </Link>
        ) : (
          <Link href={`/courses/${courseSlug}`}>
            <Button variant="secondary" size="md">
              ← Back to Course Map
            </Button>
          </Link>
        )}

        <Link href={`/courses/${courseSlug}`}>
          <Button variant="ghost" size="md">
            Course Map
          </Button>
        </Link>

        {lesson.next ? (
          <Link href={`/courses/${courseSlug}/${moduleSlug}/${lesson.next}`}>
            <Button variant="primary" size="md">
              Next Lesson →
            </Button>
          </Link>
        ) : (
          <Link href="/challenges">
            <Button variant="accent" size="md">
              Go to Challenges →
            </Button>
          </Link>
        )}
      </footer>
    </article>
  );
}
