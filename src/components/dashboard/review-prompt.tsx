"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase-client";

type ReviewPromptProps = {
  calculationCount: number;
};

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export function ReviewPrompt({ calculationCount }: ReviewPromptProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (calculationCount < 5) return;

    const dismissedAt = window.localStorage.getItem("loadiq-review-dismissed-at");

    if (!dismissedAt || Date.now() - Number(dismissedAt) > THIRTY_DAYS_MS) {
      queueMicrotask(() => setVisible(true));
    }
  }, [calculationCount]);

  async function dismiss(intent: "dismissed" | "interested") {
    window.localStorage.setItem("loadiq-review-dismissed-at", String(Date.now()));
    setVisible(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("review_prompt_tracking").upsert(
        {
          user_id: user.id,
          last_prompted_at: new Date().toISOString(),
          prompt_count: 1,
          last_response: intent,
        },
        {
          onConflict: "user_id",
        }
      );
    }
  }

  if (!visible) return null;

  return (
    <section className="mb-6 rounded-2xl border border-sky-400/25 bg-sky-400/10 p-5 shadow-[0_0_30px_rgba(56,189,248,0.12)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
            Quick check-in
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-100">
            Do you like Karpilo LoadIQ so far?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            If it is helping you think through freight decisions, a review later
            helps operators find the tool. We will wait before asking again.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void dismiss("dismissed")}
            className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-300 hover:border-sky-400"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => void dismiss("interested")}
            className="rounded-xl border border-sky-400/30 bg-sky-400/15 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-200 hover:bg-sky-400/25"
          >
            I would
          </button>
        </div>
      </div>
    </section>
  );
}
