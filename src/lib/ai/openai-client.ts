import "server-only";

import OpenAI from "openai";

export const LOADIQ_AI_MODEL = "gpt-4o-mini";

export class LoadIqAiConfigurationError extends Error {
  constructor() {
    super("OPENAI_API_KEY is required for Karpilo LoadIQ Atlas Intelligence.");
    this.name = "LoadIqAiConfigurationError";
  }
}

// TODO(Atlas migration): keep the existing feature flag name for compatibility
// during Phase 1. Introduce an Atlas-specific flag only with a reviewed rollout.
export function isLoadIqAiDevEnabled() {
  return process.env.ENABLE_LOADIQ_AI_DEV === "true";
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new LoadIqAiConfigurationError();
  }

  return new OpenAI({ apiKey });
}
