import { type NextRequest, NextResponse } from "next/server";

import { buildTokenEmail, sendAdminEmail } from "@/lib/admin/admin-email";
import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  ELEVATED_ADMIN_EMAIL,
  ELEVATED_ADMIN_ROLES,
  SECRET_HASH_ALGORITHM,
  TOKEN_TTL_MS,
  generateElevatedToken,
  hashSecret,
  isPast,
  minutesFromNow,
  timingSafeCompareSecret,
} from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function readChallenge(request: NextRequest) {
  try {
    const body = (await request.json()) as { challenge?: unknown };
    return typeof body.challenge === "string" ? body.challenge.trim() : "";
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  const result = await requireAdminAccess(ELEVATED_ADMIN_ROLES);

  if (!result.ok) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: result.status === 401 ? "failure" : "blocked",
      targetUserId: result.user?.id,
      metadata: {
        denial_status: result.status,
        user_email: result.user?.email,
        stage: "verify_challenge",
      },
    });

    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const challenge = await readChallenge(request);

  if (!challenge) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: "failure",
      metadata: { reason: "missing_challenge" },
    });

    return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: challengeRow, error: readError } = await supabaseAdmin
    .from("admin_auth_challenges")
    .select(
      "id,challenge_hash,challenge_expires_at,status,attempt_count,max_attempts",
    )
    .eq("user_id", result.access.user.id)
    .eq("status", "challenge_sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError || !challengeRow) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "suspicious_admin_attempt",
      eventType: "elevated_admin_auth",
      status: "blocked",
      metadata: { reason: readError ? "challenge_lookup_failed" : "no_active_challenge" },
    });

    return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });
  }

  if (isPast(challengeRow.challenge_expires_at)) {
    await supabaseAdmin
      .from("admin_auth_challenges")
      .update({ status: "expired" })
      .eq("id", challengeRow.id);

    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: "expired",
      subjectTable: "admin_auth_challenges",
      subjectId: challengeRow.id,
      metadata: { reason: "challenge_expired" },
    });

    return NextResponse.json({ error: "Challenge expired." }, { status: 400 });
  }

  if (!timingSafeCompareSecret(challenge, challengeRow.challenge_hash)) {
    const nextAttempts = (challengeRow.attempt_count ?? 0) + 1;
    const failed = nextAttempts >= (challengeRow.max_attempts ?? 5);

    await supabaseAdmin
      .from("admin_auth_challenges")
      .update({
        attempt_count: nextAttempts,
        status: failed ? "failed" : challengeRow.status,
      })
      .eq("id", challengeRow.id);

    await writeAdminAuditEvent({
      access: result.access,
      action: failed ? "suspicious_admin_attempt" : "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: failed ? "blocked" : "failure",
      subjectTable: "admin_auth_challenges",
      subjectId: challengeRow.id,
      metadata: { reason: "challenge_mismatch", attempts: nextAttempts },
    });

    return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });
  }

  const token = generateElevatedToken();
  const tokenExpiresAt = minutesFromNow(TOKEN_TTL_MS);

  const { error: updateError } = await supabaseAdmin
    .from("admin_auth_challenges")
    .update({
      status: "token_sent",
      challenge_verified_at: new Date().toISOString(),
      token_hash: hashSecret(token),
      token_hash_algorithm: SECRET_HASH_ALGORITHM,
      token_sent_at: new Date().toISOString(),
      token_expires_at: tokenExpiresAt,
      attempt_count: 0,
    })
    .eq("id", challengeRow.id)
    .eq("status", "challenge_sent");

  if (updateError) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: "failure",
      subjectTable: "admin_auth_challenges",
      subjectId: challengeRow.id,
      metadata: { reason: "token_update_failed" },
    });

    return NextResponse.json({ error: "Unable to verify challenge." }, { status: 500 });
  }

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_challenge_verified",
    eventType: "elevated_admin_auth",
    status: "success",
    subjectTable: "admin_auth_challenges",
    subjectId: challengeRow.id,
  });

  const email = await sendAdminEmail(buildTokenEmail(token, tokenExpiresAt));

  if (!email.ok) {
    await supabaseAdmin
      .from("admin_auth_challenges")
      .update({ status: "failed" })
      .eq("id", challengeRow.id);

    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: "failure",
      subjectTable: "admin_auth_challenges",
      subjectId: challengeRow.id,
      metadata: { reason: "token_email_failed", recipient: ELEVATED_ADMIN_EMAIL },
    });

    return NextResponse.json(
      { error: "Unable to send elevated token email." },
      { status: 500 },
    );
  }

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_token_sent",
    eventType: "elevated_admin_auth",
    status: "success",
    subjectTable: "admin_auth_challenges",
    subjectId: challengeRow.id,
    metadata: { recipient: ELEVATED_ADMIN_EMAIL },
  });

  return NextResponse.json({
    ok: true,
    message: "Elevated token sent.",
    expiresAt: tokenExpiresAt,
  });
}
