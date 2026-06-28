import "server-only";

import type { AdminAccess } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type AdminAuditStatus = "attempt" | "success" | "failure" | "blocked" | "expired";

type AdminAuditInput = {
  access: AdminAccess | null;
  action: string;
  eventType?: string;
  status?: AdminAuditStatus;
  subjectTable?: string;
  subjectId?: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAdminAuditEvent({
  access,
  action,
  eventType = "admin_action",
  status = "success",
  subjectTable,
  subjectId,
  targetUserId,
  metadata = {},
}: AdminAuditInput) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("admin_audit_events").insert({
    actor_user_id: access?.user.id ?? null,
    actor_email: access?.user.email ?? null,
    actor_role: access?.highestRole ?? null,
    action,
    event_type: eventType,
    status,
    subject_table: subjectTable ?? null,
    subject_id: subjectId ?? null,
    target_user_id: targetUserId ?? null,
    metadata,
  });

  if (error) {
    console.error("ADMIN_AUDIT_EVENT_INSERT_ERROR:", error);
  }
}
