"use client";

import { createClient } from "@/lib/supabase-client";

export type OnboardingStep =
  | "disclaimer"
  | "profile"
  | "targets"
  | "costs"
  | "pay"
  | "education"
  | "dashboard";

export type OnboardingState = {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isComplete: boolean;
};

export const defaultOnboardingState: OnboardingState = {
  currentStep: "profile",
  completedSteps: [],
  isComplete: false,
};

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error.";
  const maybeError = error as { message?: string; details?: string; code?: string };
  return [maybeError.message, maybeError.details, maybeError.code]
    .filter(Boolean)
    .join(" | ");
}

async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(formatSupabaseError(error));
  if (!user) throw new Error("User not authenticated.");

  return user;
}

export async function saveOnboardingState(state: OnboardingState) {
  const supabase = createClient();
  const user = await getCurrentUser();
  const now = new Date().toISOString();

  const { error } = await supabase.from("onboarding_states").upsert(
    {
      user_id: user.id,
      current_step: state.currentStep,
      completed_steps: state.completedSteps,
      is_complete: state.isComplete,
      completed_at: state.isComplete ? now : null,
      updated_at: now,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) throw new Error(formatSupabaseError(error));
}
