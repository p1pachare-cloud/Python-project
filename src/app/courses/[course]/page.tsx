import React from "react";
import { notFound } from "next/navigation";
import { getCourse, getAllCourses, getLessonsForModule, getModule } from "@/lib/content/loader";
import { CourseMap } from "@/components/course/CourseMap";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  const courses = getAllCourses();
  return courses.map((course) => ({
    course: course.slug,
  }));
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: courseSlug } = await params;

  let course;
  try {
    course = getCourse(courseSlug);
  } catch {
    notFound();
  }

  const modulesWithLessons = course.modules.map((mSlug) => {
    const lessons = getLessonsForModule(course.slug, mSlug);
    const moduleObj = getModule(course.slug, mSlug);
    return {
      module: moduleObj,
      lessons,
    };
  });

  return (
    <div className="min-h-screen bg-[var(--stone-50)]">
      <header className="border-b border-[var(--stone-200)] bg-white py-4 px-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--mint-500)] font-mono text-sm font-bold text-[var(--mint-950)]">
              Py
            </span>
            <span className="font-bold text-[var(--stone-900)]">PyQuest</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/challenges">
              <Button variant="ghost" size="sm">
                Challenges
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
      <main id="main-content">
        <CourseMap course={course} modules={modulesWithLessons} />
      </main>
    </div>
  );
}
