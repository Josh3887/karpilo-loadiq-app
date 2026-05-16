import { jsonResponse, withAdminApi } from "@/lib/admin/api";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async ({ access }) =>
    jsonResponse({
      user: {
        id: access.user.id,
        email: access.user.email,
      },
      highestRole: access.highestRole,
      roles: access.roles.map((role) => ({
        role: role.role,
        scope: role.scope,
        status: role.status,
        expiresAt: role.expires_at,
      })),
    }),
  {
    allowedRoles: ["support", "admin", "developer", "owner"],
    action: "admin_identity_read",
    requiresElevated: true,
  },
);
