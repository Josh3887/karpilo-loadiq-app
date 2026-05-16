import { jsonResponse, withAdminApi } from "@/lib/admin/api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async () => {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("publication_audiences")
      .select(
        "id,publication_id,audience_type,estimated_recipient_count,approved_recipient_count,created_by,reviewed_by,reviewed_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("ADMIN_PUBLICATION_AUDIENCES_READ_ERROR:", error);
      return jsonResponse(
        { error: "Failed to read publication audiences." },
        { status: 500 },
      );
    }

    return jsonResponse({ audiences: data ?? [] });
  },
  {
    allowedRoles: ["admin", "developer", "owner"],
    action: "admin_publication_audiences_read",
    requiresElevated: true,
  },
);
