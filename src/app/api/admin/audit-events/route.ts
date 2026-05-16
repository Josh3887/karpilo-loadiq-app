import { jsonResponse, withAdminApi } from "@/lib/admin/api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async ({ access }) => {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("admin_audit_events")
      .select(
        "id,actor_user_id,actor_email,actor_role,action,event_type,status,subject_table,subject_id,target_user_id,metadata,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(access.highestRole === "support" ? 25 : 100);

    if (error) {
      console.error("ADMIN_AUDIT_EVENTS_READ_ERROR:", error);
      return jsonResponse({ error: "Failed to read audit events." }, { status: 500 });
    }

    const events = (data ?? []).map((event) => ({
      id: event.id,
      actorUserId: event.actor_user_id,
      actorEmail: event.actor_email,
      actorRole: event.actor_role,
      action: event.action,
      eventType: event.event_type,
      status: event.status,
      subjectTable: event.subject_table,
      subjectId: event.subject_id,
      targetUserId: event.target_user_id,
      metadata: access.highestRole === "support" ? null : event.metadata,
      createdAt: event.created_at,
    }));

    return jsonResponse({ events });
  },
  {
    allowedRoles: ["support", "admin", "developer", "owner"],
    action: "admin_audit_events_read",
  },
);
