import { createClient } from "@/lib/supabase-server";

export type SystemHealthNotice = {
  id: string;
  status: "info" | "degraded" | "maintenance" | "warning" | "critical";
  title: string;
  public_message: string;
  starts_at: string | null;
  ends_at: string | null;
};

export async function getActiveSystemHealthNotices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("active_system_health_notices")
    .select("id,status,title,public_message,starts_at,ends_at")
    .order("starts_at", { ascending: false });

  return (data ?? []) as SystemHealthNotice[];
}
