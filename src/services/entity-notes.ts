"use client";

import { createClient } from "@/lib/supabase-client";

export type EntityNotePayload = {
  entityType: "shipper" | "consignee" | "facility";
  companyName: string;
  address: string;
  rating: number;
  notes: string;
  savedLoadId?: string;
};

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error.";
  const maybeError = error as { message?: string; details?: string; code?: string };
  return [maybeError.message, maybeError.details, maybeError.code]
    .filter(Boolean)
    .join(" | ");
}

export async function createEntityNote(payload: EntityNotePayload) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(formatSupabaseError(userError));
  if (!user) throw new Error("User not authenticated.");

  const { error } = await supabase.from("entity_notes").insert({
    user_id: user.id,
    saved_load_id: payload.savedLoadId || null,
    entity_type: payload.entityType,
    company_name: payload.companyName,
    address: payload.address,
    rating: Math.min(Math.max(Math.round(payload.rating), 1), 5),
    notes: payload.notes,
  });

  if (error) throw new Error(formatSupabaseError(error));
}
