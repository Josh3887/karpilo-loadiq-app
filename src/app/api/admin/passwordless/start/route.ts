import { type NextRequest, NextResponse } from "next/server";

import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  ADMIN_PASSWORDLESS_SUCCESS_MESSAGE,
  buildAdminPasswordlessRedirectUrl,
  getAdminPasswordlessAuditMetadata,
  getAdminPasswordlessEligibility,
  getTrustedAdminRequestOrigin,
  normalizeAdminLoginEmail,
} from "@/lib/admin/passwordless-login";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function readEmail(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown };
    return normalizeAdminLoginEmail(body.email);
  } catch {
    return "";
  }
}

function genericResponse() {
  return NextResponse.json({
    ok: true,
    message: ADMIN_PASSWORDLESS_SUCCESS_MESSAGE,
  });
}

export async function POST(request: NextRequest) {
  try {
    const email = await readEmail(request);
    const auditMetadata = getAdminPasswordlessAuditMetadata(email);

    await writeAdminAuditEvent({
      access: null,
      action: "admin_passwordless_login_attempt",
      eventType: "admin_passwordless_login",
      status: "attempt",
      metadata: auditMetadata,
    });

    const eligibility = await getAdminPasswordlessEligibility(email);

    if (!eligibility.eligible) {
      await writeAdminAuditEvent({
        access: null,
        action:
          eligibility.reason === "non_canonical_email"
            ? "suspicious_admin_attempt"
            : "admin_passwordless_login_failure",
        eventType: "admin_passwordless_login",
        status:
          eligibility.reason === "non_canonical_email" ||
          eligibility.reason === "role_missing"
            ? "blocked"
            : "failure",
        metadata: {
          ...auditMetadata,
          reason: eligibility.reason,
        },
      });

      return genericResponse();
    }

    const redirectTo = buildAdminPasswordlessRedirectUrl(
      getTrustedAdminRequestOrigin(request),
    );
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });

    if (error) {
      await writeAdminAuditEvent({
        access: eligibility.access,
        action: "admin_passwordless_login_failure",
        eventType: "admin_passwordless_login",
        status: "failure",
        targetUserId: eligibility.authUser.id,
        metadata: {
          ...auditMetadata,
          reason: "supabase_otp_send_failed",
        },
      });

      return genericResponse();
    }

    await writeAdminAuditEvent({
      access: eligibility.access,
      action: "admin_passwordless_link_sent",
      eventType: "admin_passwordless_login",
      status: "success",
      targetUserId: eligibility.authUser.id,
      metadata: {
        ...auditMetadata,
        redirect_path: "/auth/callback?next=/admin/elevated",
      },
    });

    return genericResponse();
  } catch {
    console.error("ADMIN_PASSWORDLESS_START_FAILED");
    return genericResponse();
  }
}
