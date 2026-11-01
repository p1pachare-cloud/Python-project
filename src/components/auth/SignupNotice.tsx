"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginCredentialsSchema, SignupMetadataSchema } from "../../lib/auth/schemas.ts";
import { createClient } from "../../lib/supabase/client.ts";

export function SignupNotice() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [declaredAdult, setDeclaredAdult] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (!declaredAdult) {
      setErrorMsg("You must verify you are 18 or older to create a cloud account during the current preview.");
      return;
    }

    const credsCheck = LoginCredentialsSchema.safeParse({ email, password });
    if (!credsCheck.success) {
      setErrorMsg(credsCheck.error.issues[0]?.message ?? "Please enter a valid email and password.");
      return;
    }

    const metaCheck = SignupMetadataSchema.safeParse({
      age_declaration: "18+",
      display_name: displayName.trim().length > 0 ? displayName.trim() : undefined,
    });
    if (!metaCheck.success) {
      setErrorMsg(metaCheck.error.issues[0]?.message ?? "Invalid display name format.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: credsCheck.data.email,
        password: credsCheck.data.password,
        options: {
          data: {
            age_declaration: "18+",
            ...(metaCheck.data.display_name ? { display_name: metaCheck.data.display_name } : {}),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        // Confirmation email required
        setSuccess(true);
        setLoading(false);
      }
    } catch {
      setErrorMsg("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Verification Link Sent</h2>
        <p className="text-sm text-slate-400">
          Please check <span className="text-slate-200 font-medium">{email}</span> for your confirmation link to complete registration.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 text-xs font-semibold uppercase tracking-wider text-teal-400 hover:text-teal-300 underline underline-offset-4"
        >
          Proceed to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Decision D1 Legal / Privacy Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Guest-First Platform Notice
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In accordance with our student privacy commitments (Decision D1), minors can learn anonymously in{" "}
          <strong className="text-white">Guest Mode</strong> with zero account creation and zero data collection.
          Cloud accounts currently require an explicit 18+ contractual declaration.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4" noValidate>
        {errorMsg && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
          >
            {errorMsg}
          </div>
        )}

        <div>
          <label htmlFor="signup-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adult.learner@example.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Password (Min 8 characters, max 72 UTF-8 bytes)
          </label>
          <input
            id="signup-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
          />
        </div>

        <div>
          <label htmlFor="signup-displayname" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Display Name (Optional, auto-generated if blank)
          </label>
          <input
            id="signup-displayname"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Swift_Fox_0421"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
          />
          <p className="mt-1 text-xs text-slate-500">
            3-24 alphanumeric characters or underscores. Never use your real name.
          </p>
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={declaredAdult}
              onChange={(e) => setDeclaredAdult(e.target.checked)}
              className="mt-1 w-4 h-4 rounded bg-slate-950 border-slate-700 text-teal-400 focus:ring-teal-400 focus:ring-offset-slate-900"
            />
            <span className="text-xs text-slate-300 leading-normal">
              I certify that I am at least 18 years of age and agree to the platform preview terms.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !declaredAdult}
          className="w-full py-3.5 px-4 rounded-xl font-medium text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium underline underline-offset-4">
          Sign In
        </Link>
      </div>
    </div>
  );
}
