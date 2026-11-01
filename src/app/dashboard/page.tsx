import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../../lib/supabase/server.ts";
import type { Profile } from "../../lib/supabase/types.ts";

export const metadata: Metadata = {
  title: "Dashboard | PyQuest",
  description: "Your personalized PyQuest learning stats and active challenges.",
};

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="h-8 w-24 bg-slate-800 rounded-lg"></div>
          <div className="h-8 w-20 bg-slate-800 rounded-lg"></div>
        </header>
        <div className="h-32 bg-slate-900 border border-slate-800 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-900/60 border border-slate-800/80 rounded-xl"></div>
          <div className="h-24 bg-slate-900/60 border border-slate-800/80 rounded-xl"></div>
          <div className="h-24 bg-slate-900/60 border border-slate-800/80 rounded-xl"></div>
        </div>
      </div>
    </main>
  );
}

async function DashboardContent() {
  let user: User | null = null;
  let profile: Profile | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = profileData as unknown as Profile | null;
    }
  } catch {
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Learner";
  const avatarId = profile?.avatar_id ?? "default_coder";
  const timezone = profile?.timezone ?? "UTC";
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recently";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Navigation */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <Link href="/" className="text-2xl font-black tracking-tight text-white">
            Py<span className="text-teal-400">Quest</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/courses"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              All Courses
            </Link>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>

        {/* Profile Header Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-400 flex items-center justify-center font-mono text-2xl font-bold">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{displayName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-teal-400/10 text-teal-300 border border-teal-400/20">
                  {avatarId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Account ID: <span className="font-mono text-slate-500">{user.id.slice(0, 8)}...</span> • Joined {joinedDate} • Timezone: {timezone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <Link
              href="/courses"
              className="w-full md:w-auto text-center px-5 py-2.5 rounded-xl font-medium text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors shadow-lg shadow-teal-500/20"
            >
              Resume Challenges
            </Link>
          </div>
        </section>

        {/* Overview Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Active Curriculum
            </div>
            <div className="text-2xl font-bold text-white">Python Basics</div>
            <div className="text-xs text-teal-400 mt-1">3 Lessons • 8 Challenges</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Grading Architecture
            </div>
            <div className="text-2xl font-bold text-white">Tier A Practice</div>
            <div className="text-xs text-slate-400 mt-1">Pyodide Web Worker (In-Browser)</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Privacy Mode
            </div>
            <div className="text-2xl font-bold text-white">Enforced</div>
            <div className="text-xs text-slate-400 mt-1">Zero Third-Party Trackers</div>
          </div>
        </section>

        {/* Available Modules Link */}
        <section className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-2">Available Learning Modules</h2>
          <p className="text-sm text-slate-400 mb-4">
            Practice Python syntax, string manipulation, and arithmetic directly in your browser with real-time feedback.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/challenges/sum-two-numbers"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
            >
              Sum Two Numbers (Challenge) →
            </Link>
            <Link
              href="/challenges/reverse-string"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
            >
              Reverse String (Challenge) →
            </Link>
            <Link
              href="/challenges/fizz-buzz-item"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
            >
              FizzBuzz Item (Challenge) →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
