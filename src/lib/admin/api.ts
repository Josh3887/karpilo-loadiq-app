import "server-only";

import { NextResponse } from "next/server";

import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  type AdminAccess,
  type AdminRole,
  requireAdminAccess,
} from "@/lib/admin/roles";

type AdminApiContext = {
  access: AdminAccess;
};

type AdminApiHandler = (context: AdminApiContext) => Promise<Response>;

type AdminApiOptions = {
  allowedRoles: readonly AdminRole[];
  action: string;
};

export function jsonResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function withAdminApi(handler: AdminApiHandler, options: AdminApiOptions) {
  return async function adminRouteHandler() {
    try {
      const result = await requireAdminAccess(options.allowedRoles);

      if (!result.ok) {
        await writeAdminAuditEvent({
          access: result.access,
          action: options.action,
          eventType: "admin_api_access",
          status: result.status === 401 ? "failure" : "blocked",
          metadata: {
            allowed_roles: options.allowedRoles,
            denial_status: result.status,
          },
        });

        return jsonResponse({ error: result.error }, { status: result.status });
      }

      await writeAdminAuditEvent({
        access: result.access,
        action: options.action,
        eventType: "admin_api_access",
        status: "success",
        metadata: {
          allowed_roles: options.allowedRoles,
        },
      });

      return handler({ access: result.access });
    } catch (error) {
      console.error("ADMIN_API_ROUTE_ERROR:", error);
      return jsonResponse({ error: "Admin route failed." }, { status: 500 });
    }
  };
}
