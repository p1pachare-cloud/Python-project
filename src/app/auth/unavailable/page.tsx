import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Temporarily Unavailable | PyQuest",
  description: "PyQuest authentication service is momentarily undergoing maintenance.",
};

export default function AuthUnavailablePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Authentication Unavailable
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          We are momentarily unable to reach the authentication service.
          Your existing login session and browser progress remain completely safe.
        </p>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            Guest Mode Always Active
          </div>
          <p className="text-xs text-slate-400">
            You can continue practicing Python challenges in Guest Mode. All code and test feedback run locally in your browser.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/courses"
            className="w-full py-3 px-4 rounded-xl font-medium text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors shadow-lg shadow-teal-500/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Continue Learning in Guest Mode
          </Link>

          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
