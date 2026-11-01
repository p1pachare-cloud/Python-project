import { z } from "zod";

/**
 * Display name format rule:
 * 3 to 24 characters, alphanumeric and underscores only.
 */
export const DISPLAY_NAME_REGEX = /^[A-Za-z0-9_]{3,24}$/;

export const DisplayNameSchema = z
  .string({ message: "Display name must be a string." })
  .trim()
  .min(3, "Display name must be at least 3 characters.")
  .max(24, "Display name cannot exceed 24 characters.")
  .regex(
    DISPLAY_NAME_REGEX,
    "Display name can only contain letters, numbers, and underscores."
  );

/**
 * Contractual self-declaration of majority.
 * In accordance with Decision D1, cloud registration requires an explicit declaration of 18+.
 * Note: This is an application contractual gate, not verified age assurance.
 */
export const AgeDeclarationSchema = z.literal("18+", {
  message: "PyQuest Cloud Accounts currently require an explicit 18+ declaration.",
});

export const AvatarIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9_-]{3,32}$/, "Avatar ID must be 3-32 characters (lowercase alphanumeric, dash, underscore).")
  .default("default_coder");

export const TimezoneSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_\/+]{2,64}$/, "Timezone must be a valid IANA timezone string.")
  .default("UTC");

/**
 * Signup metadata schema passed into Supabase GoTrue raw_user_meta_data.
 */
export const SignupMetadataSchema = z.object({
  age_declaration: AgeDeclarationSchema,
  display_name: DisplayNameSchema.optional(),
  avatar_id: AvatarIdSchema.optional(),
  timezone: TimezoneSchema.optional(),
});

export type SignupMetadata = z.infer<typeof SignupMetadataSchema>;

/**
 * Login credentials schema for email/password authentication.
 */
export const LoginCredentialsSchema = z.object({
  email: z
    .string({ message: "Email is required." })
    .trim()
    .email("Please provide a valid email address."),
  password: z
    .string({ message: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .refine(
      (pw) => new TextEncoder().encode(pw).length <= 72,
      "Password cannot exceed 72 UTF-8 bytes."
    ),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
