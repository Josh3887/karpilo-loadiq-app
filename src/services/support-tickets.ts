"use client";

import { createClient } from "@/lib/supabase-client";

export type SupportTicketPayload = {
  category:
    | "support"
    | "bug"
    | "refund"
    | "billing"
    | "feature"
    | "privacy"
    | "account_deletion";
  subject: string;
  message: string;
  relatedLoadId?: string;
};

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error.";
  const maybeError = error as { message?: string; details?: string; code?: string };
  return [maybeError.message, maybeError.details, maybeError.code]
    .filter(Boolean)
    .join(" | ");
}

export async function createSupportTicket(payload: SupportTicketPayload) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(formatSupabaseError(userError));
  if (!user) throw new Error("User not authenticated.");

  const { error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    category: payload.category,
    subject: payload.subject,
    message: payload.message,
    related_load_id: payload.relatedLoadId || null,
    status: "open",
  });

  if (error) throw new Error(formatSupabaseError(error));
}
