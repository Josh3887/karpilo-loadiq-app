import { jsonResponse, withAdminApi } from "@/lib/admin/api";
import {
  parseDiagnosticEventFilters,
  readAdminDiagnosticEvents,
} from "@/lib/admin/diagnostic-events";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async (_context, request) => {
    const filters = parseDiagnosticEventFilters(new URL(request.url).searchParams);

    try {
      const events = await readAdminDiagnosticEvents(filters);
      return jsonResponse({
        filters,
        events: events.map((event) => ({
          created_at: event.createdAt,
          severity: event.severity,
          source: event.source,
          route: event.route,
          message: event.message,
          digest: event.digest,
          release_version: event.releaseVersion,
          status: event.resolvedAt ? "resolved" : "open",
        })),
      });
    } catch (error) {
      console.error("ADMIN_DIAGNOSTIC_EVENTS_READ_ERROR:", error);
      return jsonResponse(
        { error: "Failed to read diagnostic events." },
        { status: 500 },
      );
    }
  },
  {
    allowedRoles: ["admin", "developer", "owner"],
    action: "admin_diagnostic_events_read",
    requiresElevated: true,
  },
);
