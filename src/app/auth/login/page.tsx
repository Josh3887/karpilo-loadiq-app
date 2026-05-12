import { AppStorePlaceholders } from "@/components/app-store/app-store-placeholders";
import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { LaunchStatusBanner } from "@/components/launch/launch-status-banner";
import { getLaunchPhaseSnapshot } from "@/config/launch-phases";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-8 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
          <LoadIqMark size="lg" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
            Karpilo LoadIQ
          </p>
          <h1 className="mt-2 text-3xl font-black">Login</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Access your freight profitability command center.
          </p>
          <LoginForm />
        </section>

        <div className="space-y-4">
          <LaunchStatusBanner
            initialSnapshot={getLaunchPhaseSnapshot()}
            compact
          />
          <AppStorePlaceholders />
        </div>
      </div>
    </main>
  );
}
