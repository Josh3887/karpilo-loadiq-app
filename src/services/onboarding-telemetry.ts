"use client";

import { APP_VERSION } from "@/config/app-policies";
import { ROLLOUT_CONFIG, RolloutPhaseCode } from "@/config/rollout";
import { createClient } from "@/lib/supabase-client";
import { Json } from "@/types/supabase";

type EventPayload = Record<string, Json | undefined>;

function cleanPayload(payload: EventPayload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Record<string, Json>;
}

async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User not authenticated.");

  return { supabase, user };
}

export async function recordOnboardingEvent(params: {
  eventName: string;
  rolloutPhase?: RolloutPhaseCode;
  payload?: EventPayload;
}) {
  const { supabase, user } = await getCurrentUser();

  const { error } = await supabase.from("onboarding_events").insert({
    user_id: user.id,
    event_name: params.eventName,
    rollout_phase: params.rolloutPhase ?? null,
    event_payload: cleanPayload({
      appVersion: APP_VERSION,
      ...params.payload,
    }),
  });

  if (error) throw error;
}

export async function recordDisclaimerAcceptanceEvent(params: {
  policyVersion: string;
  source?: string;
  rolloutPhase?: RolloutPhaseCode;
  payload?: EventPayload;
}) {
  const { supabase, user } = await getCurrentUser();

  const { error } = await supabase.from("disclaimer_acceptance_events").insert({
    user_id: user.id,
    email: user.email ?? null,
    policy_version: params.policyVersion,
    rollout_phase: params.rolloutPhase ?? null,
    source: params.source ?? ROLLOUT_CONFIG.telemetrySources.appGate,
    event_payload: cleanPayload({
      appVersion: APP_VERSION,
      ...params.payload,
    }),
  });

  if (error) throw error;
}

export async function recordWelcomeMessageView(params: {
  rolloutPhase: RolloutPhaseCode;
  messageKey: string;
  source?: string;
  payload?: EventPayload;
}) {
  const { supabase, user } = await getCurrentUser();

  const { error } = await supabase.from("welcome_message_views").insert({
    user_id: user.id,
    rollout_phase: params.rolloutPhase,
    message_key: params.messageKey,
    source: params.source ?? ROLLOUT_CONFIG.telemetrySources.founderWelcome,
    event_payload: cleanPayload({
      appVersion: APP_VERSION,
      ...params.payload,
    }),
  });

  if (error) throw error;
}

export async function recordOnboardingFeedbackEvent(params: {
  category: string;
  message: string;
  rolloutPhase?: RolloutPhaseCode;
  payload?: EventPayload;
}) {
  const { supabase, user } = await getCurrentUser();

  const { error } = await supabase.from("onboarding_feedback_events").insert({
    user_id: user.id,
    email: user.email ?? null,
    category: params.category,
    message: params.message,
    rollout_phase: params.rolloutPhase ?? null,
    event_payload: cleanPayload({
      appVersion: APP_VERSION,
      ...params.payload,
    }),
  });

  if (error) throw error;
}
