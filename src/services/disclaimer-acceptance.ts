"use client";

import {
  LOADIQ_DISCLAIMER_LAST_UPDATED,
  LOADIQ_DISCLAIMER_VERSION,
} from "@/config/legal";
import { createClient } from "@/lib/supabase-client";

export async function acceptLoadIqDisclaimer() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to accept the LoadIQ disclaimer.");
  }

  const acceptedAt = new Date().toISOString();
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      disclaimer_accepted_at: acceptedAt,
      disclaimer_version: LOADIQ_DISCLAIMER_VERSION,
      disclaimer_last_updated: LOADIQ_DISCLAIMER_LAST_UPDATED,
      updated_at: acceptedAt,
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("disclaimer_acceptances")
    .insert({
      user_id: user.id,
      disclaimer_version: LOADIQ_DISCLAIMER_VERSION,
      disclaimer_last_updated: LOADIQ_DISCLAIMER_LAST_UPDATED,
      accepted_at: acceptedAt,
    })
    .then(({ error: auditError }) => {
      if (auditError) {
        console.warn("Disclaimer audit insert skipped.", auditError.message);
      }
    });

  return acceptedAt;
}
