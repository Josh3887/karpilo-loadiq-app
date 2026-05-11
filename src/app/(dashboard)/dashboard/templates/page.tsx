import Link from "next/link";
import { redirect } from "next/navigation";

import { LaneTemplateDeleteButton } from "@/components/dashboard/lane-template-delete-button";
import { createClient } from "@/lib/supabase-server";

type LaneTemplate = {
  id: string;
  name: string;
  pickup_zip: string;
  delivery_zip: string;
  created_at: string;
};

export default async function LaneTemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: templates, error } = await supabase
    .from("lane_templates")
    .select("id, name, pickup_zip, delivery_zip, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Lane Templates
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Reuse known lanes as fast-start profitability models.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 hover:bg-sky-400/20"
          >
            Dashboard
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.08)]">
          {!templates || templates.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              No lane templates yet. Save one from a load detail page.
            </div>
          ) : (
            <div className="space-y-3">
              {(templates as LaneTemplate[]).map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#060B14] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 className="font-semibold text-slate-100">
                      {template.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {template.pickup_zip} to {template.delivery_zip} ·{" "}
                      {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard?template=${template.id}`}
                      className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
                    >
                      Load
                    </Link>

                    <LaneTemplateDeleteButton templateId={template.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
