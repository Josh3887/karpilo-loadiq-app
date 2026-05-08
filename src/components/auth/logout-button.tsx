"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase-client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/20"
    >
      Logout
    </button>
  );
}