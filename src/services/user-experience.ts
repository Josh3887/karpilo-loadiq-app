"use client";

import { createClient } from "@/lib/supabase-client";

function nowIso() {
  return new Date().toISOString();
}

async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User not authenticated.");
  return user.id;
}

export async function markFounderWelcomeCompleted() {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const timestamp = nowIso();

  const { error } = await supabase.from("user_experience_state").upsert({
    user_id: userId,
    founder_welcome_completed_at: timestamp,
    updated_at: timestamp,
  });

  if (error) throw error;
}

export async function dismissPilotStatusCard() {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const timestamp = nowIso();

  const { error } = await supabase.from("user_experience_state").upsert({
    user_id: userId,
    pilot_status_card_dismissed_at: timestamp,
    updated_at: timestamp,
  });

  if (error) throw error;
}
