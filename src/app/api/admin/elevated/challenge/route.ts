import { type NextRequest, NextResponse } from "next/server";

import { buildChallengeEmail, sendAdminEmail } from "@/lib/admin/admin-email";
import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  CHALLENGE_TTL_MS,
  ELEVATED_ADMIN_EMAIL,
  ELEVATED_ADMIN_ROLES,
  SECRET_HASH_ALGORITHM,
  generateElevatedChallenge,
  getRequestFingerprint,
  hashSecret,
  isPast,
  minutesFromNow,
} from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function isActiveChallenge(row: {
  status: string;
  challenge_expires_at: string | null;
  token_expires_at: string | null;
  elevated_session_expires_at: string | null;
}) {
  if (row.status === "challenge_sent" || row.status === "challenge_verified") {
    return !isPast(row.challenge_expires_at);
  }

  if (row.status === "token_sent") {
    return !isPast(row.token_expires_at);
  }

  if (row.status === "token_verified") {
    return !isPast(row.elevated_session_expires_at);
  }

  return false;
}

export async function POST(request: NextRequest) {
  const result = await requireAdminAccess(ELEVATED_ADMIN_ROLES);

  if (!result.ok) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_attempt",
      eventType: "elevated_admin_auth",
      status: result.status === 401 ? "failure" : "blocked",
      targetUserId: result.user?.id,
      metadata: {
        denial_status: result.status,
        user_email: result.user?.email,
      },
    });

    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_login_attempt",
    eventType: "elevated_admin_auth",
    status: "attempt",
    metadata: { recipient: ELEVATED_ADMIN_EMAIL },
  });

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: activeChallenge, error: activeError } = await supabaseAdmin
    .from("admin_auth_challenges")
    .select(
      "id,status,challenge_expires_at,token_expires_at,elevated_session_expires_at",
    )
    .eq("user_id", result.access.user.id)
    .in("status", [
      "challenge_sent",
      "challenge_verified",
      "token_sent",
      "token_verified",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: "failure",
      metadata: { reason: "active_challenge_lookup_failed" },
    });

    return NextResponse.json(
      { error: "Unable to start elevated authentication." },
      { status: 500 },
    );
  }

  if (activeChallenge && isActiveChallenge(activeChallenge)) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "suspicious_admin_attempt",
      eventType: "elevated_admin_auth",
      status: "blocked",
      subjectTable: "admin_auth_challenges",
      subjectId: activeChallenge.id,
      metadata: { reason: "active_challenge_already_exists" },
    });

    return NextResponse.json(
      { error: "An elevated authentication request is already active." },
      { status: 429 },
    );
  }

  const challenge = generateElevatedChallenge();
  const challengeExpiresAt = minutesFromNow(CHALLENGE_TTL_MS);
  const fingerprint = getRequestFingerprint(request.headers);

  const { data: challengeRow, error: insertError } = await supabaseAdmin
    .from("admin_auth_challenges")
    .insert({
      user_id: result.access.user.id,
      identity_email: result.access.user.email ?? ELEVATED_ADMIN_EMAIL,
      challenge_hash: hashSecret(challenge),
      challenge_hash_algorithm: SECRET_HASH_ALGORITHM,
      challenge_sent_to: ELEVATED_ADMIN_EMAIL,
      challenge_expires_at: challengeExpiresAt,
      request_ip_hash: fingerprint.requestIpHash,
      user_agent_hash: fingerprint.userAgentHash,
      metadata: {
        requested_role: result.access.highestRole,
        recipient: ELEVATED_ADMIN_EMAIL,
      },
    })
    .select("id")
    .single();

  if (insertError || !challengeRow) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: "failure",
      metadata: { reason: "challenge_insert_failed" },
    });

    return NextResponse.json(
      { error: "Unable to start elevated authentication." },
      { status: 500 },
    );
  }

  const email = await sendAdminEmail(
    buildChallengeEmail(challenge, challengeExpiresAt),
  );

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
      metadata: { reason: "challenge_email_failed" },
    });

    return NextResponse.json(
      { error: "Unable to send elevated authentication email." },
      { status: 500 },
    );
  }

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_challenge_sent",
    eventType: "elevated_admin_auth",
    status: "success",
    subjectTable: "admin_auth_challenges",
    subjectId: challengeRow.id,
    metadata: { recipient: ELEVATED_ADMIN_EMAIL },
  });

  return NextResponse.json({
    ok: true,
    message: "Elevated challenge sent.",
    expiresAt: challengeExpiresAt,
  });
}
