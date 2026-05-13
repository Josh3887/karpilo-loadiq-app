"use client";

import { createClient } from "@/lib/supabase-client";

export type FeedbackPayload = {
  subject: string;
  message: string;
  rating?: number | null;
  source?: string;
};

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error.";
  const maybeError = error as { message?: string; details?: string; code?: string };
  return [maybeError.message, maybeError.details, maybeError.code]
    .filter(Boolean)
    .join(" | ");
}

export async function createFeedback(payload: FeedbackPayload) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(formatSupabaseError(userError));
  if (!user) throw new Error("User not authenticated.");

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    rating: payload.rating ?? null,
    feedback: `${payload.subject}\n\n${payload.message}`,
    source: payload.source ?? "app_support_feedback",
  });

  if (error) throw new Error(formatSupabaseError(error));
}
