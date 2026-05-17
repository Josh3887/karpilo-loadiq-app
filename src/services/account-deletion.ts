export type AccountDeletionPayload = {
  contactEmail: string;
  reason?: string;
  requestedScope: "account_and_data" | "data_only";
  acknowledgedSubscriptionWarning: boolean;
  confirmationPhrase: string;
};

export async function requestAccountDeletion(payload: AccountDeletionPayload) {
  const response = await fetch("/api/account/deletion-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.error ?? "Unable to submit account deletion request."
    );
  }
}
