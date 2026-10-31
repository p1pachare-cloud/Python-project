import fs from "fs";
import path from "path";
import {
  CourseSchema,
  ModuleSchema,
  LessonSchema,
  ChallengeSchema,
  type Course,
  type Module,
  type Lesson,
  type Challenge,
} from "../src/lib/content/schemas.ts";

const CONTENT_ROOT = path.join(process.cwd(), "content");

interface ValidationContext {
  courseCount: number;
  moduleCount: number;
  lessonCount: number;
  challengeCount: number;
  seenIds: Map<string, string>; // id -> filePath
  errors: string[];
}

function runContentValidation(): void {
  console.log("=== PyQuest Content Schema & Integrity Validator ===");
  console.log(`Inspecting content directory: ${CONTENT_ROOT}\n`);

  if (!fs.existsSync(CONTENT_ROOT)) {
    console.error("ERROR: Content directory not found!");
    process.exit(1);
  }

  const ctx: ValidationContext = {
    courseCount: 0,
    moduleCount: 0,
    lessonCount: 0,
    challengeCount: 0,
    seenIds: new Map(),
    errors: [],
  };

  const courseDirs = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });

  for (const cDir of courseDirs) {
    if (!cDir.isDirectory()) continue;

    const coursePath = path.join(CONTENT_ROOT, cDir.name, "course.json");
    if (!fs.existsSync(coursePath)) {
      ctx.errors.push(`Missing course.json in ${cDir.name}`);
      continue;
    }

    let course: Course;
    try {
      const raw = JSON.parse(fs.readFileSync(coursePath, "utf-8"));
      course = CourseSchema.parse(raw);
      ctx.courseCount++;
      validateUniqueId(course.id, coursePath, ctx);
    } catch (err: unknown) {
      ctx.errors.push(`Invalid course.json at ${coursePath}: ${(err as Error).message}`);
      continue;
    }

    // Validate modules in course
    for (const modSlug of course.modules) {
      const moduleDir = path.join(CONTENT_ROOT, cDir.name, modSlug);
      const modulePath = path.join(moduleDir, "module.json");

      if (!fs.existsSync(modulePath)) {
        ctx.errors.push(`Course '${course.slug}' references non-existent module '${modSlug}' at ${modulePath}`);
        continue;
      }

      let moduleObj: Module;
      try {
        const raw = JSON.parse(fs.readFileSync(modulePath, "utf-8"));
        moduleObj = ModuleSchema.parse(raw);
        ctx.moduleCount++;
        validateUniqueId(moduleObj.id, modulePath, ctx);
      } catch (err: unknown) {
        ctx.errors.push(`Invalid module.json at ${modulePath}: ${(err as Error).message}`);
        continue;
      }

      const lessonMap = new Map<string, Lesson>();

      // Validate lessons
      for (const lessonFile of moduleObj.lessons) {
        const lessonPath = path.join(moduleDir, lessonFile);
        if (!fs.existsSync(lessonPath)) {
          ctx.errors.push(`Module '${moduleObj.slug}' references non-existent lesson '${lessonFile}'`);
          continue;
        }

        try {
          const raw = JSON.parse(fs.readFileSync(lessonPath, "utf-8"));
          const lesson = LessonSchema.parse(raw);
          ctx.lessonCount++;
          validateUniqueId(lesson.id, lessonPath, ctx);
          lessonMap.set(lesson.slug, lesson);

          // Verify exercise constraints if present
          if (lesson.exercise) {
            if (lesson.exercise.xp !== 20) {
              ctx.errors.push(`Lesson '${lesson.id}' has exercise XP = ${lesson.exercise.xp}. Standard lesson XP must be 20.`);
            }
            if (lesson.exercise.visibleTests.length === 0) {
              ctx.errors.push(`Lesson '${lesson.id}' exercise has no visible tests.`);
            }
          }
        } catch (err: unknown) {
          ctx.errors.push(`Invalid lesson at ${lessonPath}: ${(err as Error).message}`);
        }
      }

      // Verify prev/next links resolution within module lessons
      for (const [slug, lesson] of lessonMap.entries()) {
        if (lesson.next && !lessonMap.has(lesson.next)) {
          ctx.errors.push(`Lesson '${slug}' references next='${lesson.next}' which does not exist in module '${moduleObj.slug}'.`);
        }
        if (lesson.prev && !lessonMap.has(lesson.prev)) {
          ctx.errors.push(`Lesson '${slug}' references prev='${lesson.prev}' which does not exist in module '${moduleObj.slug}'.`);
        }
      }

      // Validate challenges if present
      if (moduleObj.challenges) {
        for (const challengeRelPath of moduleObj.challenges) {
          const challengePath = path.join(moduleDir, challengeRelPath);
          if (!fs.existsSync(challengePath)) {
            ctx.errors.push(`Module '${moduleObj.slug}' references non-existent challenge '${challengeRelPath}'`);
            continue;
          }

          try {
            const raw = JSON.parse(fs.readFileSync(challengePath, "utf-8"));
            const challenge: Challenge = ChallengeSchema.parse(raw);
            ctx.challengeCount++;
            validateUniqueId(challenge.id, challengePath, ctx);

            // Verify challenge XP rules
            const expectedXP =
              challenge.difficulty === "easy" ? 30 : challenge.difficulty === "medium" ? 60 : 100;
            if (challenge.xp !== expectedXP) {
              ctx.errors.push(
                `Challenge '${challenge.id}' with difficulty '${challenge.difficulty}' has XP = ${challenge.xp}. Expected ${expectedXP} XP.`
              );
            }

            // Phase 5: Challenge completeness rules
            if (!challenge.referenceSolution || !challenge.referenceSolution.trim()) {
              ctx.errors.push(`Challenge '${challenge.id}' is missing a required referenceSolution.`);
            }

            if (challenge.examples.length < 2) {
              ctx.errors.push(`Challenge '${challenge.id}' must provide at least 2 illustrated examples.`);
            }

            if (challenge.visibleTests.length < 2) {
              ctx.errors.push(`Challenge '${challenge.id}' must have at least 2 visible test cases.`);
            }

            if (challenge.additionalChecks.length < 2) {
              ctx.errors.push(`Challenge '${challenge.id}' must have at least 2 additional check test cases.`);
            }

            const allChallengeTests = [...challenge.visibleTests, ...challenge.additionalChecks];
            allChallengeTests.forEach((t, tIdx) => {
              if (!t.feedbackOnFail || !t.feedbackOnFail.trim()) {
                ctx.errors.push(`Challenge '${challenge.id}' test case #${tIdx + 1} is missing feedbackOnFail.`);
              }
              if (t.kind === "call" && t.compare === "approx") {
                const isNumeric = typeof t.expected === "number" || (Array.isArray(t.expected) && t.expected.every(v => typeof v === "number"));
                if (!isNumeric) {
                  ctx.errors.push(`Challenge '${challenge.id}' test case #${tIdx + 1} has compare='approx' but non-numeric expected value.`);
                }
              }
            });
          } catch (err: unknown) {
            ctx.errors.push(`Invalid challenge at ${challengePath}: ${(err as Error).message}`);
          }
        }
      }
    }
  }

  // Report summary
  console.log("-----------------------------------------");
  console.log(`Courses Validated:    ${ctx.courseCount}`);
  console.log(`Modules Validated:    ${ctx.moduleCount}`);
  console.log(`Lessons Validated:    ${ctx.lessonCount}`);
  console.log(`Challenges Validated: ${ctx.challengeCount}`);
  console.log(`Unique Content IDs:   ${ctx.seenIds.size}`);
  console.log("-----------------------------------------");

  if (ctx.errors.length > 0) {
    console.error(`\n❌ Content validation failed with ${ctx.errors.length} error(s):`);
    ctx.errors.forEach((err, idx) => {
      console.error(`  ${idx + 1}. ${err}`);
    });
    process.exit(1);
  }

  console.log("\n✅ All learning content successfully validated against Zod schemas and integrity rules!");
}

function validateUniqueId(id: string, filePath: string, ctx: ValidationContext): void {
  if (ctx.seenIds.has(id)) {
    const original = ctx.seenIds.get(id);
    ctx.errors.push(`Duplicate content ID '${id}' found in:\n   ${filePath}\n   Original in: ${original}`);
  } else {
    ctx.seenIds.set(id, filePath);
  }
}

runContentValidation();
