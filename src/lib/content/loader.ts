import fs from "fs";
import path from "path";
import {
  CourseSchema,
  type Course,
  ModuleSchema,
  type Module,
  LessonSchema,
  type Lesson,
  ChallengeSchema,
  type Challenge,
} from "./schemas.ts";

const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * Reads and parses a JSON file with Zod schema validation
 */
function readAndValidateJson<T>(filePath: string, schema: { parse: (data: unknown) => T }): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Content file not found: ${filePath}`);
  }
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawContent) as unknown;
  return schema.parse(data);
}

/**
 * Retrieves a single course by its slug
 */
export function getCourse(courseSlug: string): Course {
  const coursePath = path.join(CONTENT_ROOT, courseSlug, "course.json");
  return readAndValidateJson(coursePath, CourseSchema);
}

/**
 * Retrieves all available courses
 */
export function getAllCourses(): Course[] {
  if (!fs.existsSync(CONTENT_ROOT)) {
    return [];
  }
  const entries = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });
  const courses: Course[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const coursePath = path.join(CONTENT_ROOT, entry.name, "course.json");
      if (fs.existsSync(coursePath)) {
        courses.push(readAndValidateJson(coursePath, CourseSchema));
      }
    }
  }

  return courses;
}

/**
 * Retrieves a module within a course
 */
export function getModule(courseSlug: string, moduleSlug: string): Module {
  const modulePath = path.join(CONTENT_ROOT, courseSlug, moduleSlug, "module.json");
  return readAndValidateJson(modulePath, ModuleSchema);
}

/**
 * Retrieves all modules in a course
 */
export function getModulesForCourse(courseSlug: string): Module[] {
  const course = getCourse(courseSlug);
  return course.modules.map((mSlug) => getModule(courseSlug, mSlug));
}

/**
 * Retrieves a lesson by course, module, and lesson slug
 */
export function getLesson(courseSlug: string, moduleSlug: string, lessonSlug: string): Lesson {
  const moduleDir = path.join(CONTENT_ROOT, courseSlug, moduleSlug);
  const files = fs.readdirSync(moduleDir);
  const lessonFile = files.find((file) => file.endsWith(".lesson.json") && file.includes(lessonSlug));

  if (!lessonFile) {
    throw new Error(`Lesson ${lessonSlug} not found in ${courseSlug}/${moduleSlug}`);
  }

  const lessonPath = path.join(moduleDir, lessonFile);
  return readAndValidateJson(lessonPath, LessonSchema);
}

/**
 * Retrieves all lessons within a module
 */
export function getLessonsForModule(courseSlug: string, moduleSlug: string): Lesson[] {
  const mod = getModule(courseSlug, moduleSlug);
  return mod.lessons.map((lessonFile) => {
    const lessonPath = path.join(CONTENT_ROOT, courseSlug, moduleSlug, lessonFile);
    return readAndValidateJson(lessonPath, LessonSchema);
  });
}

/**
 * Retrieves all challenges across all courses
 */
export function getAllChallenges(): { challenge: Challenge; courseSlug: string; moduleSlug: string }[] {
  const courses = getAllCourses();
  const results: { challenge: Challenge; courseSlug: string; moduleSlug: string }[] = [];

  for (const course of courses) {
    for (const moduleSlug of course.modules) {
      const challengeDir = path.join(CONTENT_ROOT, course.slug, moduleSlug, "challenges");
      if (fs.existsSync(challengeDir)) {
        const files = fs.readdirSync(challengeDir);
        for (const file of files) {
          if (file.endsWith(".challenge.json")) {
            const challenge = readAndValidateJson(
              path.join(challengeDir, file),
              ChallengeSchema
            );
            results.push({ challenge, courseSlug: course.slug, moduleSlug });
          }
        }
      }
    }
  }

  return results;
}

/**
 * Retrieves a challenge by its slug
 */
export function getChallenge(challengeSlug: string): { challenge: Challenge; courseSlug: string; moduleSlug: string } | null {
  const all = getAllChallenges();
  return all.find((item) => item.challenge.slug === challengeSlug) ?? null;
}
