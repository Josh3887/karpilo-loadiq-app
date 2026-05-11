"use client";

import { createClient } from "@/lib/supabase-client";

export type AccountDeletionPayload = {
  contactEmail: string;
  reason?: string;
  requestedScope: "account_and_data" | "data_only";
  acknowledgedSubscriptionWarning: boolean;
};

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error.";
  const maybeError = error as { message?: string; details?: string; code?: string };
  return [maybeError.message, maybeError.details, maybeError.code]
    .filter(Boolean)
    .join(" | ");
}

export async function requestAccountDeletion(payload: AccountDeletionPayload) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(formatSupabaseError(userError));
  if (!user) {
    throw new Error(
      "Sign in to submit an in-app deletion request, or use the support email on this page."
    );
  }

  if (!payload.acknowledgedSubscriptionWarning) {
    throw new Error("Confirm subscription cancellation guidance before submitting.");
  }

  const { error } = await supabase.from("account_deletion_requests").insert({
    user_id: user.id,
    contact_email: payload.contactEmail || user.email,
    requested_scope: payload.requestedScope,
    reason: payload.reason || null,
    status: "open",
    metadata: {
      source: "in_app_account_deletion_form",
      subscription_warning_acknowledged:
        payload.acknowledgedSubscriptionWarning,
    },
  });

  if (error) throw new Error(formatSupabaseError(error));
}
