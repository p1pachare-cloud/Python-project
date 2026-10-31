import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  LessonSchema,
  ChallengeSchema,
  ModuleSchema,
  CourseSchema,
} from "../src/lib/content/schemas.ts";
import {
  getAllCourses,
  getCourse,
  getModule,
  getLesson,
  getChallenge,
} from "../src/lib/content/loader.ts";

describe("Content Zod Schemas", () => {
  test("validates a compliant lesson fixture", () => {
    const validLesson = {
      id: "test.lesson.01",
      slug: "test-lesson",
      title: "Test Lesson",
      status: "published" as const,
      objectives: ["Understand basic syntax"],
      estimatedMinutes: 5,
      body: [
        {
          kind: "markdown" as const,
          content: "This is test explanation content.",
        },
      ],
      exercise: {
        instructions: "Write a program that prints 42.",
        starterCode: "print(42)\n",
        visibleTests: [
          {
            kind: "stdout" as const,
            expected: "42\n",
            compare: "trimmed" as const,
          },
        ],
        hints: ["Use print(42)"],
        xp: 20,
        minSeconds: 10,
      },
    };

    const parsed = LessonSchema.safeParse(validLesson);
    assert.equal(parsed.success, true);
  });

  test("rejects lesson with invalid slug or missing id", () => {
    const badSlug = {
      id: "test.lesson.02",
      slug: "INVALID SLUG WITH SPACES",
      title: "Test Lesson",
      status: "published" as const,
      objectives: ["Objective"],
      estimatedMinutes: 5,
      body: [{ kind: "markdown" as const, content: "Content" }],
    };
    const parsed = LessonSchema.safeParse(badSlug);
    assert.equal(parsed.success, false);
  });

  test("rejects exercise with empty visible test cases", () => {
    const noTests = {
      id: "test.lesson.03",
      slug: "test-no-tests",
      title: "No Tests",
      status: "published" as const,
      objectives: ["Objective"],
      estimatedMinutes: 5,
      body: [{ kind: "markdown" as const, content: "Content" }],
      exercise: {
        instructions: "Some instructions that are long enough",
        starterCode: "",
        visibleTests: [], // violates min(1)
        hints: [],
        xp: 20,
      },
    };
    const parsed = LessonSchema.safeParse(noTests);
    assert.equal(parsed.success, false);
  });

  test("validates a compliant challenge fixture", () => {
    const validChallenge = {
      id: "test.challenge.01",
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "easy" as const,
      statement: "Given an array of integers, return indices of two numbers that add up to target.",
      examples: [
        {
          input: "[2, 7, 11, 15], target = 9",
          output: "[0, 1]",
        },
      ],
      starterCode: "def two_sum(nums, target):\n    pass\n",
      visibleTests: [
        {
          kind: "call" as const,
          fn: "two_sum",
          args: [[2, 7, 11, 15], 9],
          expected: [0, 1],
        },
      ],
      hints: ["Consider using a hash map"],
      xp: 30,
      tags: ["array", "hash-table"],
    };

    const parsed = ChallengeSchema.safeParse(validChallenge);
    assert.equal(parsed.success, true);
  });

  test("rejects challenge with missing tags or missing examples", () => {
    const badChallenge = {
      id: "test.challenge.02",
      slug: "bad-challenge",
      title: "Bad Challenge",
      difficulty: "hard" as const,
      statement: "Problem statement here...",
      examples: [], // violates min(1)
      starterCode: "pass",
      visibleTests: [],
      hints: [],
      xp: 100,
      tags: [], // violates min(1)
    };
    const parsed = ChallengeSchema.safeParse(badChallenge);
    assert.equal(parsed.success, false);
  });
});

describe("Content Loader Functions", () => {
  test("loads all courses successfully from repository", () => {
    const courses = getAllCourses();
    assert.ok(courses.length >= 1);
    const pythonBasics = courses.find((c) => c.slug === "python-basics");
    assert.ok(pythonBasics);
    assert.equal(pythonBasics.title, "Python Fundamentals");
  });

  test("loads 01-first-steps module with 3 lessons and 8 challenges", () => {
    const mod = getModule("python-basics", "01-first-steps");
    assert.equal(mod.title, "First Steps in Python");
    assert.equal(mod.lessons.length, 3);
    assert.equal(mod.challenges?.length, 8);
  });

  test("loads individual lesson correctly", () => {
    const lesson = getLesson("python-basics", "01-first-steps", "01-hello-world");
    assert.equal(lesson.title, "Hello, Python!");
    assert.equal(lesson.status, "published");
    assert.ok(lesson.exercise);
    assert.equal(lesson.exercise.xp, 20);
    assert.equal(lesson.next, "02-variables-and-types");
  });

  test("validates CourseSchema and ModuleSchema", () => {
    const validCourse = {
      id: "course.test",
      slug: "test-course",
      title: "Test Course",
      description: "Test description for course",
      modules: ["mod-1"],
    };
    assert.equal(CourseSchema.safeParse(validCourse).success, true);

    const validModule = {
      id: "module.test",
      slug: "mod-1",
      title: "Module 1",
      description: "Test description for module",
      order: 1,
      lessons: ["lesson-1.json"],
    };
    assert.equal(ModuleSchema.safeParse(validModule).success, true);
  });

  test("loads individual course via getCourse", () => {
    const course = getCourse("python-basics");
    assert.equal(course.slug, "python-basics");
    assert.equal(course.title, "Python Fundamentals");
  });

  test("loads individual challenges correctly", () => {
    const slugs = [
      "sum-two-numbers",
      "celsius-to-fahrenheit",
      "is-even",
      "reverse-string",
      "count-vowels",
      "find-maximum",
      "calculate-average",
      "fizz-buzz-item",
    ];

    for (const slug of slugs) {
      const data = getChallenge(slug);
      assert.ok(data, `Challenge '${slug}' should be discoverable by loader`);
      assert.ok(data.challenge.title.length > 0);
      assert.ok(data.challenge.referenceSolution && data.challenge.referenceSolution.length > 0);
      assert.ok(data.challenge.visibleTests.length >= 2);
      assert.ok(data.challenge.additionalChecks.length >= 2);
    }
  });
});
