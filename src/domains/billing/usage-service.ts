import { createClient } from "@/lib/supabase-client";

export type UsageEventName =
  | "calculation_created"
  | "load_saved"
  | "export_requested"
  | "upgrade_prompt_viewed";

export async function recordUsageEvent(
  eventName: UsageEventName,
  eventPayload: Record<string, unknown> = {}
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("usage_events").insert({
    user_id: user?.id ?? null,
    event_name: eventName,
    event_payload: eventPayload,
  });

  if (error) {
    throw new Error(error.message);
  }
}
