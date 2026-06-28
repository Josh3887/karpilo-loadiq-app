"use client";

import { createClient } from "@/lib/supabase-client";

export type LegalDocumentType =
  | "terms_of_service"
  | "privacy_policy"
  | "refund_policy"
  | "subscription_terms";

export type LegalAcknowledgmentInput = {
  documentType: LegalDocumentType;
  documentVersion: string;
  metadata?: Record<string, unknown>;
};

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error.";
  const maybeError = error as { message?: string; details?: string; code?: string };
  return [maybeError.message, maybeError.details, maybeError.code]
    .filter(Boolean)
    .join(" | ");
}

export async function acknowledgeLegalDocument(
  input: LegalAcknowledgmentInput
) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(formatSupabaseError(userError));
  if (!user) throw new Error("User not authenticated.");

  const { data: document } = await supabase
    .from("legal_documents")
    .select("id")
    .eq("document_type", input.documentType)
    .eq("version", input.documentVersion)
    .eq("is_active", true)
    .maybeSingle();

  const { error } = await supabase.from("user_legal_acknowledgments").insert({
    user_id: user.id,
    document_id: document?.id ?? null,
    document_type: input.documentType,
    document_version: input.documentVersion,
    metadata: input.metadata ?? {},
  });

  if (error) throw new Error(formatSupabaseError(error));
}

export async function acknowledgeLaunchLegalBundle() {
  const bundle = [
    {
      documentType: "terms_of_service" as const,
      documentVersion: "2026-05-11",
    },
    {
      documentType: "privacy_policy" as const,
      documentVersion: "2026-05-11",
    },
    {
      documentType: "refund_policy" as const,
      documentVersion: "2026-05-11",
    },
    {
      documentType: "subscription_terms" as const,
      documentVersion: "2026-05-11",
    },
  ];

  await Promise.all(
    bundle.map((document) =>
      acknowledgeLegalDocument({
        ...document,
        metadata: {
          bundle: "loadiq-launch-legal",
          source: "onboarding",
        },
      })
    )
  );
}
