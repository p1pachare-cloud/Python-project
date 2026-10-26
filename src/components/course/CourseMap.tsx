import React from "react";
import Link from "next/link";
import { type Course, type Module, type Lesson } from "@/lib/content/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CourseMapProps {
  course: Course;
  modules: {
    module: Module;
    lessons: Lesson[];
  }[];
}

export function CourseMap({ course, modules }: CourseMapProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Course Header Banner */}
      <div className="mb-10 rounded-[var(--radius-lg)] border border-[var(--stone-200)] bg-white p-6 sm:p-8 shadow-[var(--shadow-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Badge variant="mint" className="mb-3">
              Official Course Track
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--stone-900)]">
              {course.title}
            </h1>
            <p className="mt-2 text-base text-[var(--stone-600)] leading-relaxed max-w-2xl">
              {course.description}
            </p>
          </div>
          <div className="sm:text-right shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--stone-500)] block">
              Curriculum Path
            </span>
            <span className="text-lg font-bold text-[var(--stone-900)]">
              {modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons
            </span>
          </div>
        </div>
      </div>

      {/* Modules Roadmap */}
      <div className="space-y-8" aria-label="Course Modules Path">
        {modules.map(({ module, lessons }, modIdx) => (
          <section
            key={module.id}
            className="rounded-[var(--radius-lg)] border border-[var(--stone-200)] bg-[var(--stone-50)] p-6"
            aria-labelledby={`module-heading-${module.id}`}
          >
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--stone-200)] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--mint-700)]">
                  Module {String(modIdx + 1).padStart(2, "0")}
                </span>
                <h2
                  id={`module-heading-${module.id}`}
                  className="text-xl font-bold text-[var(--stone-900)]"
                >
                  {module.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--stone-600)]">
                  {module.description}
                </p>
              </div>
              <Badge variant="neutral">
                {lessons.length} Lessons
              </Badge>
            </div>

            {/* Lesson Node List */}
            <div className="grid grid-cols-1 gap-3.5">
              {lessons.map((lesson, lIdx) => (
                <div
                  key={lesson.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--stone-200)] bg-white p-4 transition-colors hover:border-[var(--mint-400)]"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--stone-100)] text-xs font-bold text-[var(--stone-700)]">
                      {lIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--stone-900)]">
                        {lesson.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--stone-500)]">
                        <span>⏱ ~{lesson.estimatedMinutes} min</span>
                        <span>·</span>
                        <span className="capitalize">{lesson.status}</span>
                        {lesson.exercise && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-[var(--mint-700)]">
                              +{lesson.exercise.xp} XP
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/courses/${course.slug}/${module.slug}/${lesson.slug}`}
                    >
                      <Button variant="primary" size="sm">
                        Start Lesson
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Module Challenges Preview */}
            {module.challenges && module.challenges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--stone-200)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="coral">Practice Challenge</Badge>
                  <span className="text-xs text-[var(--stone-600)]">
                    Includes visible tests and progressive hints
                  </span>
                </div>
                <Link href="/challenges">
                  <Button variant="ghost" size="sm">
                    View Challenges →
                  </Button>
                </Link>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
