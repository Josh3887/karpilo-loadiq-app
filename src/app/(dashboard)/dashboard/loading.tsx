export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-8 w-48 rounded bg-slate-800" />
        <div className="mt-6 h-20 rounded-2xl border border-slate-800 bg-[#0B1220]/80" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="h-160 rounded-2xl border border-slate-800 bg-[#0B1220]/80" />
          <div className="h-120 rounded-2xl border border-slate-800 bg-[#0B1220]/80" />
        </div>
      </div>
    </main>
  );
}
