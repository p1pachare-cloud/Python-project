-- ============================================================================
-- PyQuest Phase 6B Migration: User Profiles & Hardened RLS
-- Migration: 20261031000001_auth_profiles.sql
-- ============================================================================

-- 1. Create User Age Band Enum
CREATE TYPE public.user_age_band AS ENUM ('adult', 'minor');

-- 2. Create Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(24) NOT NULL,
    avatar_id VARCHAR(32) NOT NULL DEFAULT 'default_coder',
    age_band public.user_age_band NOT NULL DEFAULT 'adult',
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Case-Insensitive Unique Index for Display Name
CREATE UNIQUE INDEX idx_profiles_display_name_lower 
ON public.profiles (lower(display_name));

-- Format Constraint on Display Name (3 to 24 alphanumeric or underscores)
ALTER TABLE public.profiles ADD CONSTRAINT chk_display_name_format
    CHECK (display_name ~ '^[A-Za-z0-9_]{3,24}$');

-- 4. Enable Row Level Security (Standard RLS: Table owner bypasses, force RLS is false)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Revoke Inherent Privileges from Public & Client Roles
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- 6. Granular Table Grants
-- Authenticated users can read profiles:
GRANT SELECT ON TABLE public.profiles TO authenticated;
-- Authenticated users can ONLY update safe, mutable presentation columns:
GRANT UPDATE (display_name, avatar_id, timezone) ON TABLE public.profiles TO authenticated;
-- Notice: INSERT and DELETE remain strictly revoked from anon and authenticated.

-- 7. Immutability & Updated-At Trigger
CREATE OR REPLACE FUNCTION public.fn_enforce_profile_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.id <> OLD.id THEN
        RAISE EXCEPTION 'Profile ID is immutable';
    END IF;
    IF NEW.age_band <> OLD.age_band THEN
        RAISE EXCEPTION 'Profile age_band is immutable';
    END IF;
    IF NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'Profile created_at is immutable';
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.fn_enforce_profile_immutability() OWNER TO postgres;

CREATE TRIGGER trg_profiles_immutability
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_profile_immutability();

-- 8. Hardened Profile Creation Trigger (Runs on auth.users insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    adjectives TEXT[] := ARRAY[
        'Swift', 'Bright', 'Clever', 'Agile', 'Bold',
        'Brave', 'Curious', 'Eager', 'Fierce', 'Gentle',
        'Happy', 'Keen', 'Lively', 'Mighty', 'Nimble',
        'Quick', 'Rustic', 'Silent', 'Wise', 'Zealous'
    ];
    animals TEXT[] := ARRAY[
        'Fox', 'Owl', 'Panda', 'Tiger', 'Bear',
        'Falcon', 'Wolf', 'Otter', 'Dolphin', 'Eagle',
        'Hawk', 'Koala', 'Lynx', 'Panther', 'Raven',
        'Seal', 'Badger', 'Cheetah', 'Gecko', 'Lemur'
    ];
    cand TEXT;
    custom_name TEXT;
    raw_avatar TEXT;
    raw_tz TEXT;
    age_decl TEXT;
    attempt INT;
    max_retries CONSTANT INT := 8; -- 9 total attempts (0..8)
    cand_collision BOOLEAN;
BEGIN
    -- 1. Enforce explicit 18+ contractual self-declaration
    age_decl := NEW.raw_user_meta_data->>'age_declaration';
    IF age_decl IS NULL OR age_decl <> '18+' THEN
        RAISE EXCEPTION 'Registration requires an explicit age_declaration of 18+';
    END IF;

    -- 2. Metadata sanitization and validation
    raw_avatar := NULLIF(trim(NEW.raw_user_meta_data->>'avatar_id'), '');
    IF raw_avatar IS NOT NULL AND raw_avatar !~ '^[a-z0-9_-]{3,32}$' THEN
        RAISE EXCEPTION 'Invalid avatar_id format';
    END IF;

    raw_tz := NULLIF(trim(NEW.raw_user_meta_data->>'timezone'), '');
    IF raw_tz IS NOT NULL AND raw_tz !~ '^[A-Za-z0-9_\/+]{2,64}$' THEN
        RAISE EXCEPTION 'Invalid timezone format';
    END IF;

    -- 3. Display Name Selection & Collision Resolution
    custom_name := NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), '');

    IF custom_name IS NOT NULL THEN
        IF custom_name !~ '^[A-Za-z0-9_]{3,24}$' THEN
            RAISE EXCEPTION 'Display name must be 3-24 alphanumeric characters or underscores';
        END IF;

        IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(display_name) = lower(custom_name)) THEN
            RAISE EXCEPTION 'Display name already taken';
        END IF;

        cand := custom_name;
    ELSE
        -- Pseudonym retry loop (consumes random() ONLY when custom_name is null)
        FOR attempt IN 0..max_retries LOOP
            cand := adjectives[1 + floor(random() * 20)::int] || '_' ||
                    animals[1 + floor(random() * 20)::int] || '_' ||
                    lpad(floor(random() * 10000)::text, 4, '0');

            SELECT EXISTS (
                SELECT 1 FROM public.profiles WHERE lower(display_name) = lower(cand)
            ) INTO cand_collision;

            IF NOT cand_collision THEN
                EXIT;
            END IF;

            -- On exhausting 9 collisions, engage 24-character UUID fallback
            IF attempt = max_retries THEN
                cand := 'Coder_' || substring(replace(NEW.id::text, '-', ''), 1, 18);
                
                -- Verify fallback uniqueness
                IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(display_name) = lower(cand)) THEN
                    RAISE EXCEPTION 'Fatal pseudonym generation collision on fallback';
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- 4. Insert Profile as Table Owner (postgres)
    -- age_band is strictly set to 'adult'; untrusted client age_band metadata is ignored
    INSERT INTO public.profiles (
        id,
        display_name,
        avatar_id,
        age_band,
        timezone,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        cand,
        COALESCE(raw_avatar, 'default_coder'),
        'adult'::public.user_age_band,
        COALESCE(raw_tz, 'UTC'),
        now(),
        now()
    );

    RETURN NEW;
END;
$$;

-- 9. Explicit Trigger Function Ownership
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 10. Hook Trigger onto auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Revoke Direct Function Execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_enforce_profile_immutability() FROM PUBLIC, anon, authenticated;

-- 12. Non-Recursive RLS Policies
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));
