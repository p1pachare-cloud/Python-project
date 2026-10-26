import React from "react";
import { notFound } from "next/navigation";
import { getAllCourses, getLessonsForModule, getLesson } from "@/lib/content/loader";
import { LessonRenderer } from "@/components/lesson/LessonRenderer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  const courses = getAllCourses();
  const params: { course: string; module: string; lesson: string }[] = [];

  for (const course of courses) {
    for (const modSlug of course.modules) {
      const lessons = getLessonsForModule(course.slug, modSlug);
      for (const lesson of lessons) {
        params.push({
          course: course.slug,
          module: modSlug,
          lesson: lesson.slug,
        });
      }
    }
  }

  return params;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; module: string; lesson: string }>;
}) {
  const { course: courseSlug, module: moduleSlug, lesson: lessonSlug } = await params;

  let lesson;
  try {
    lesson = getLesson(courseSlug, moduleSlug, lessonSlug);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--stone-50)]">
      {/* Top Header */}
      <header className="border-b border-[var(--stone-200)] bg-white py-3.5 px-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href={`/courses/${courseSlug}`} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--mint-500)] font-mono text-sm font-bold text-[var(--mint-950)]">
              Py
            </span>
            <span className="font-bold text-[var(--stone-900)]">PyQuest</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/courses/${courseSlug}`}>
              <Button variant="secondary" size="sm">
                Map
              </Button>
            </Link>
            <Link href="/challenges">
              <Button variant="ghost" size="sm">
                Challenges
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content">
        <LessonRenderer
          lesson={lesson}
          courseSlug={courseSlug}
          moduleSlug={moduleSlug}
        />
      </main>
    </div>
  );
}
