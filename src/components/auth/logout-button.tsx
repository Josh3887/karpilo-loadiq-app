"use client";

import { useRouter } from "next/navigation";

import { usePreviewMode } from "@/components/preview/preview-mode-provider";
import { ANALYTICS_EVENTS, trackAnalyticsEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase-client";

export function LogoutButton() {
  const preview = usePreviewMode();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    if (preview.enabled) {
      preview.explain("logout");
      return;
    }

    await supabase.auth.signOut();
    void trackAnalyticsEvent(ANALYTICS_EVENTS.USER_SIGNED_OUT, {
      route: "/auth/logout",
    });

    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      data-preview-explain="logout"
      onClick={handleLogout}
      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/20"
    >
      {preview.enabled ? "Exit Preview" : "Logout"}
    </button>
  );
}
