"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoginCredentialsSchema } from "../../lib/auth/schemas.ts";
import { createClient } from "../../lib/supabase/client.ts";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    const validation = LoginCredentialsSchema.safeParse({ email, password });
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]?.message ?? "Please provide valid credentials.";
      setErrorMsg(firstIssue);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMsg("Incorrect email or password. Please try again.");
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred while connecting to authentication. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errorMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5"
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="email-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
        >
          Email Address
        </label>
        <input
          id="email-input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="learner@example.com"
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label
          htmlFor="password-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
        >
          Password
        </label>
        <input
          id="password-input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-4 rounded-xl font-medium text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span
              className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      <div className="pt-2 text-center text-xs text-slate-400">
        Prefer to practice without an account?{" "}
        <Link
          href="/courses"
          className="text-teal-400 hover:text-teal-300 font-medium underline underline-offset-4"
        >
          Continue as Guest
        </Link>
      </div>
    </form>
  );
}
