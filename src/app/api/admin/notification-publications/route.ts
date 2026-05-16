import { jsonResponse, withAdminApi } from "@/lib/admin/api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async () => {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("notification_publications")
      .select(
        "id,template_id,title,channel,status,public_visible,severity,scheduled_at,published_at,cancelled_at,author_user_id,submitted_by,approved_by,published_by,cancelled_by,approval_notes,public_metadata,created_at,updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("ADMIN_NOTIFICATION_PUBLICATIONS_READ_ERROR:", error);
      return jsonResponse(
        { error: "Failed to read notification publications." },
        { status: 500 },
      );
    }

    return jsonResponse({ publications: data ?? [] });
  },
  {
    allowedRoles: ["admin", "developer", "owner"],
    action: "admin_notification_publications_read",
    requiresElevated: true,
  },
);
