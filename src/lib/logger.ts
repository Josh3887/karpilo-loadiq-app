type LogContext = Record<string, unknown>;

export function logError(error: unknown, context: LogContext = {}) {
  const message = error instanceof Error ? error.message : String(error);

  console.error("[LoadIQ]", message, context);
}
