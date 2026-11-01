import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "../../components/auth/LoginForm.tsx";

export const metadata: Metadata = {
  title: "Sign In | PyQuest",
  description: "Sign in to your PyQuest account to sync your Python journey and achievements.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl font-black tracking-tight text-white mb-2">
            Py<span className="text-teal-400">Quest</span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to track progress, earn badges, and resume challenges.
          </p>
        </div>

        <Suspense fallback={<div className="h-48 flex items-center justify-center text-slate-500 text-sm">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
