import { z } from "zod";

/**
 * PyQuest Content Validation Schemas
 * Source of truth: TRD Section 4 & AGENTS.md
 */

export const TestCaseStdoutSchema = z.object({
  kind: z.literal("stdout"),
  stdin: z.string().optional(),
  expected: z.string(),
  compare: z.enum(["exact", "trimmed"]).default("trimmed"),
  feedbackOnFail: z.string().optional(),
});

export const TestCaseCallSchema = z.object({
  kind: z.literal("call"),
  fn: z.string().min(1, "Function name is required"),
  args: z.array(z.unknown()),
  expected: z.unknown(),
  compare: z.enum(["equal", "approx"]).default("equal"),
  tolerance: z.number().positive().optional().default(0.0001),
  feedbackOnFail: z.string().optional(),
});

export const TestCaseSchema = z.discriminatedUnion("kind", [
  TestCaseStdoutSchema,
  TestCaseCallSchema,
]);

export type TestCase = z.infer<typeof TestCaseSchema>;

export const BlockMarkdownSchema = z.object({
  kind: z.literal("markdown"),
  content: z.string().min(1, "Markdown content cannot be empty"),
});

export const BlockCodeExampleSchema = z.object({
  kind: z.literal("codeExample"),
  code: z.string().min(1, "Code cannot be empty"),
  language: z.literal("python").default("python"),
  caption: z.string().optional(),
});

export const BlockCalloutSchema = z.object({
  kind: z.literal("callout"),
  type: z.enum(["info", "warning", "tip"]),
  title: z.string().optional(),
  text: z.string().min(1, "Callout text cannot be empty"),
});

export const BlockQuizSchema = z.object({
  kind: z.literal("quiz"),
  question: z.string().min(1, "Question cannot be empty"),
  options: z.array(z.string()).min(2, "Quiz must have at least 2 options"),
  answerIndex: z.number().int().nonnegative(),
  explanation: z.string().optional(),
});

export const BlockSchema = z.discriminatedUnion("kind", [
  BlockMarkdownSchema,
  BlockCodeExampleSchema,
  BlockCalloutSchema,
  BlockQuizSchema,
]);

export type Block = z.infer<typeof BlockSchema>;

export const ExerciseSchema = z.object({
  instructions: z.string().min(10, "Instructions must be descriptive"),
  starterCode: z.string(),
  visibleTests: z.array(TestCaseSchema).min(1, "Exercise must have at least 1 visible test case"),
  hints: z.array(z.string().min(1)).max(3, "Exercises support a maximum of 3 hints"),
  xp: z.number().int().positive().default(20),
  minSeconds: z.number().int().positive().default(20),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

export const LessonSchema = z.object({
  id: z.string().min(3, "Lesson id is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  status: z.enum(["draft", "published"]),
  objectives: z.array(z.string().min(1)).min(1, "At least one learning objective is required"),
  estimatedMinutes: z.number().int().min(1).max(60),
  body: z.array(BlockSchema).min(1, "Lesson body must contain at least 1 content block"),
  exercise: ExerciseSchema.optional(),
  prev: z.string().optional(),
  next: z.string().optional(),
});

export type Lesson = z.infer<typeof LessonSchema>;

export const ChallengeExampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().optional(),
});

export const ChallengeSchema = z.object({
  id: z.string().min(3, "Challenge id is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  statement: z.string().min(10, "Problem statement is required"),
  examples: z.array(ChallengeExampleSchema).min(1, "At least one I/O example is required"),
  starterCode: z.string().min(1, "Starter code is required"),
  visibleTests: z.array(TestCaseSchema).min(1, "At least one visible test is required"),
  hints: z.array(z.string().min(1)).max(3, "Maximum 3 hints permitted"),
  xp: z.number().int().positive(),
  tags: z.array(z.string()).min(1, "At least one tag required"),
  additionalChecks: z.array(TestCaseSchema).default([]),
  referenceSolution: z.string().optional(),
});

export type Challenge = z.infer<typeof ChallengeSchema>;

export const ModuleSchema = z.object({
  id: z.string().min(3, "Module id is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(3, "Module title is required"),
  description: z.string().min(10, "Module description is required"),
  order: z.number().int().nonnegative(),
  lessons: z.array(z.string().min(1)).min(1, "Module must contain at least one lesson"),
  challenges: z.array(z.string().min(1)).optional().default([]),
});

export type Module = z.infer<typeof ModuleSchema>;

export const CourseSchema = z.object({
  id: z.string().min(3, "Course id is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(3, "Course title is required"),
  description: z.string().min(10, "Course description is required"),
  modules: z.array(z.string().min(1)).min(1, "Course must contain at least one module"),
});

export type Course = z.infer<typeof CourseSchema>;
