import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

type DeletionRequestPayload = {
  contactEmail?: unknown;
  reason?: unknown;
  requestedScope?: unknown;
  acknowledgedSubscriptionWarning?: unknown;
  confirmationPhrase?: unknown;
};

const REQUEST_SCOPE_VALUES = new Set(["account_and_data", "data_only"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as DeletionRequestPayload;
  const acknowledgedSubscriptionWarning =
    body.acknowledgedSubscriptionWarning === true;
  const confirmationPhrase = String(body.confirmationPhrase ?? "").trim();
  const requestedScope = REQUEST_SCOPE_VALUES.has(String(body.requestedScope))
    ? String(body.requestedScope)
    : "account_and_data";
  const contactEmail =
    String(body.contactEmail ?? user.email ?? "").trim().toLowerCase() ||
    user.email ||
    null;
  const reason = String(body.reason ?? "").trim();

  if (!acknowledgedSubscriptionWarning || confirmationPhrase !== "DELETE") {
    return NextResponse.json(
      {
        error:
          "Confirm the subscription warning and type DELETE before submitting.",
      },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error: profileError } = await admin.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      deletion_requested_at: now,
      deletion_status: "deletion_requested",
      account_status: "deletion_requested",
      updated_at: now,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json(
      { error: "Unable to mark account deletion request." },
      { status: 500 }
    );
  }

  const { data: existingRequest, error: lookupError } = await admin
    .from("account_deletion_requests")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["open", "in_review"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { error: "Unable to check existing deletion requests." },
      { status: 500 }
    );
  }

  const requestRecord = {
    user_id: user.id,
    contact_email: contactEmail,
    requested_scope: requestedScope,
    reason: reason || null,
    status: "open",
    metadata: {
      source: "self_service_account_deletion_request",
      subscription_warning_acknowledged: acknowledgedSubscriptionWarning,
      confirmation_phrase_verified: true,
      auth_user_email: user.email ?? null,
    },
    updated_at: now,
  };

  const { error: requestError } = existingRequest?.id
    ? await admin
        .from("account_deletion_requests")
        .update(requestRecord)
        .eq("id", existingRequest.id)
    : await admin.from("account_deletion_requests").insert({
        ...requestRecord,
        requested_at: now,
      });

  if (requestError) {
    return NextResponse.json(
      { error: "Unable to submit account deletion request." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: "deletion_requested",
    message:
      "Account deletion request received. Subscription cancellation remains separate through billing management.",
  });
}
