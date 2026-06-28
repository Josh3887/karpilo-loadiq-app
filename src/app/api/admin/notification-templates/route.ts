import { jsonResponse, withAdminApi } from "@/lib/admin/api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async () => {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("notification_templates")
      .select(
        "id,template_key,channel,name,subject,status,created_by,updated_by,approved_by,approved_at,created_at,updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("ADMIN_NOTIFICATION_TEMPLATES_READ_ERROR:", error);
      return jsonResponse(
        { error: "Failed to read notification templates." },
        { status: 500 },
      );
    }

    return jsonResponse({ templates: data ?? [] });
  },
  {
    allowedRoles: ["admin", "developer", "owner"],
    action: "admin_notification_templates_read",
    requiresElevated: true,
  },
);
