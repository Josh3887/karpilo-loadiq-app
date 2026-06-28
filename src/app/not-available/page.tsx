import Link from "next/link";

export const metadata = {
  title: "Not Available | Karpilo LoadIQ App",
  description: "Unavailable Karpilo LoadIQ app portal feature status.",
};

export default function NotAvailablePage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#0B1220] p-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
          Not Available
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          This app area is not open yet.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          Public signup, checkout, calculator, reports, maps, AI insights,
          fleet tools, and admin tooling are not exposed through this primitive
          access surface.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-400 px-5 text-sm font-black uppercase tracking-[0.16em] text-[#060B14]"
          >
            Login
          </Link>
          <Link
            href="/request-access"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 px-5 text-sm font-black uppercase tracking-[0.16em] text-sky-300"
          >
            Request Access
          </Link>
        </div>
      </section>
    </main>
  );
}
