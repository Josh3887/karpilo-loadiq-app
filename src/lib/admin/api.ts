import "server-only";

import { NextResponse } from "next/server";

import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  clearElevatedSessionCookie,
  getElevatedSessionStatus,
} from "@/lib/admin/elevated-auth";
import {
  type AdminAccess,
  type AdminRole,
  requireAdminAccess,
} from "@/lib/admin/roles";

type AdminApiContext = {
  access: AdminAccess;
};

type AdminApiHandler = (
  context: AdminApiContext,
  request: Request,
) => Promise<Response>;

type AdminApiOptions = {
  allowedRoles: readonly AdminRole[];
  action: string;
  requiresElevated?: boolean;
};

export function jsonResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function withAdminApi(handler: AdminApiHandler, options: AdminApiOptions) {
  return async function adminRouteHandler(request: Request) {
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

      if (options.requiresElevated) {
        const elevatedStatus = await getElevatedSessionStatus(result.access);

        if (!elevatedStatus.elevated) {
          if (elevatedStatus.reason && elevatedStatus.reason !== "missing") {
            await clearElevatedSessionCookie();
          }

          const suspiciousReasons = ["invalid", "inactive", "not_found"];
          const eventType = suspiciousReasons.includes(
            elevatedStatus.reason ?? "",
          )
            ? "suspicious_admin_attempt"
            : "admin_api_elevated_access";
          const status =
            elevatedStatus.reason === "expired" ? "expired" : "blocked";

          await writeAdminAuditEvent({
            access: result.access,
            action: options.action,
            eventType,
            status,
            metadata: {
              allowed_roles: options.allowedRoles,
              elevated_required: true,
              elevated_reason: elevatedStatus.reason ?? "unknown",
            },
          });

          return jsonResponse({ error: "elevated_required" }, { status: 403 });
        }
      }

      await writeAdminAuditEvent({
        access: result.access,
        action: options.action,
        eventType: "admin_api_access",
        status: "success",
        metadata: {
          allowed_roles: options.allowedRoles,
          elevated_required: options.requiresElevated ?? false,
        },
      });

      return handler({ access: result.access }, request);
    } catch (error) {
      console.error("ADMIN_API_ROUTE_ERROR:", error);
      return jsonResponse({ error: "Admin route failed." }, { status: 500 });
    }
  };
}
