import { type NextRequest, NextResponse } from "next/server";

import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  ELEVATED_ADMIN_ROLES,
  ELEVATED_SESSION_TTL_MS,
  generateElevatedSessionSecret,
  hashSecret,
  isPast,
  minutesFromNow,
  setElevatedSessionCookie,
  timingSafeCompareSecret,
} from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function readToken(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: unknown };
    return typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return "";
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
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
        stage: "verify_token",
      },
    });

    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const token = await readToken(request);

  if (!token) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: "failure",
      metadata: { reason: "missing_token" },
    });

    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: challengeRow, error: readError } = await supabaseAdmin
    .from("admin_auth_challenges")
    .select(
      "id,token_hash,token_expires_at,status,attempt_count,max_attempts,metadata",
    )
    .eq("user_id", result.access.user.id)
    .eq("status", "token_sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError || !challengeRow) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "suspicious_admin_attempt",
      eventType: "elevated_admin_auth",
      status: "blocked",
      metadata: { reason: readError ? "token_lookup_failed" : "no_active_token" },
    });

    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  if (isPast(challengeRow.token_expires_at)) {
    await supabaseAdmin
      .from("admin_auth_challenges")
      .update({ status: "expired" })
      .eq("id", challengeRow.id);

    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_token_expired",
      eventType: "elevated_admin_auth",
      status: "expired",
      subjectTable: "admin_auth_challenges",
      subjectId: challengeRow.id,
      metadata: { reason: "token_expired" },
    });

    return NextResponse.json({ error: "Token expired." }, { status: 400 });
  }

  if (!timingSafeCompareSecret(token, challengeRow.token_hash)) {
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
      metadata: { reason: "token_mismatch", attempts: nextAttempts },
    });

    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const sessionSecret = generateElevatedSessionSecret();
  const sessionExpiresAt = minutesFromNow(ELEVATED_SESSION_TTL_MS);
  const metadata = {
    ...asRecord(challengeRow.metadata),
    elevated_session_hash: hashSecret(sessionSecret),
    elevated_session_hash_algorithm: "hmac-sha256",
    elevated_session_created_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabaseAdmin
    .from("admin_auth_challenges")
    .update({
      status: "token_verified",
      token_verified_at: new Date().toISOString(),
      elevated_session_expires_at: sessionExpiresAt,
      metadata,
    })
    .eq("id", challengeRow.id)
    .eq("status", "token_sent");

  if (updateError) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_login_failure",
      eventType: "elevated_admin_auth",
      status: "failure",
      subjectTable: "admin_auth_challenges",
      subjectId: challengeRow.id,
      metadata: { reason: "session_update_failed" },
    });

    return NextResponse.json({ error: "Unable to verify token." }, { status: 500 });
  }

  await setElevatedSessionCookie({
    challengeId: challengeRow.id,
    sessionSecret,
    expiresAt: sessionExpiresAt,
  });

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_token_verified",
    eventType: "elevated_admin_auth",
    status: "success",
    subjectTable: "admin_auth_challenges",
    subjectId: challengeRow.id,
  });

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_login_success",
    eventType: "elevated_admin_auth",
    status: "success",
    subjectTable: "admin_auth_challenges",
    subjectId: challengeRow.id,
    metadata: { elevated_session_expires_at: sessionExpiresAt },
  });

  return NextResponse.json({
    ok: true,
    elevated: true,
    expiresAt: sessionExpiresAt,
  });
}
