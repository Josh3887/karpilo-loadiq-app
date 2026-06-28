import "server-only";

export const OWNER_BUILD_ACCESS_SCOPE = "owner_build_access";

export type OwnerOverrideDiagnostics = {
  ownerOverrideConfigured: boolean;
  ownerOverrideMatched: boolean;
};

const loggedDiagnosticKeys = new Set<string>();

export function normalizeOwnerEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function parseOwnerAccessEmails(value: string | null | undefined) {
  return (value ?? "")
    .split(/[\s,]+/)
    .map(normalizeOwnerEmail)
    .filter(Boolean);
}

export function getConfiguredOwnerEmails() {
  return parseOwnerAccessEmails(process.env.LOADIQ_OWNER_EMAILS);
}

export function getOwnerOverrideDiagnostics(
  userEmail: string | null | undefined
): OwnerOverrideDiagnostics {
  const ownerEmails = getConfiguredOwnerEmails();
  const normalizedUserEmail = normalizeOwnerEmail(userEmail);

  return {
    ownerOverrideConfigured: ownerEmails.length > 0,
    ownerOverrideMatched:
      normalizedUserEmail.length > 0 && ownerEmails.includes(normalizedUserEmail),
  };
}

export function isOwnerBuildAccessEmail(userEmail: string | null | undefined) {
  return getOwnerOverrideDiagnostics(userEmail).ownerOverrideMatched;
}

export function logOwnerOverrideDiagnostics(
  diagnostics: OwnerOverrideDiagnostics,
  context: string
) {
  const diagnosticKey = [
    context,
    diagnostics.ownerOverrideConfigured,
    diagnostics.ownerOverrideMatched,
  ].join(":");

  if (loggedDiagnosticKeys.has(diagnosticKey)) return;

  loggedDiagnosticKeys.add(diagnosticKey);
  console.info("LOADIQ_OWNER_EMAILS diagnostics", {
    context,
    ownerOverrideConfigured: diagnostics.ownerOverrideConfigured,
    ownerOverrideMatched: diagnostics.ownerOverrideMatched,
  });
}
