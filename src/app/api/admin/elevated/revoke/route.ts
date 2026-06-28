import { NextResponse } from "next/server";

import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  ELEVATED_ADMIN_ROLES,
  clearElevatedSessionCookie,
  readElevatedSessionCookie,
} from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await requireAdminAccess(ELEVATED_ADMIN_ROLES);

  if (!result.ok) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "elevated_session_revoked",
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

  const cookieValue = await readElevatedSessionCookie();

  if (cookieValue) {
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin
      .from("admin_auth_challenges")
      .update({ status: "revoked" })
      .eq("id", cookieValue.challengeId)
      .eq("user_id", result.access.user.id);
  }

  await clearElevatedSessionCookie();

  await writeAdminAuditEvent({
    access: result.access,
    action: "elevated_session_revoked",
    eventType: "elevated_admin_auth",
    status: "success",
    subjectTable: cookieValue ? "admin_auth_challenges" : undefined,
    subjectId: cookieValue?.challengeId,
  });

  return NextResponse.json({ ok: true, elevated: false });
}
