# API Adapter Pattern

All external provider integrations must follow a server-side adapter pattern.

## Required Flow

1. UI submits a LoadIQ-shaped request.
2. Server route validates authentication, authorization, entitlement, request shape, and safety limits.
3. Integration adapter calls the vendor or external service.
4. Adapter normalizes the vendor response into a LoadIQ internal shape.
5. Server route applies cache, fallback, redaction, and error behavior.
6. UI receives LoadIQ-safe data only.

Vendor response shapes must not leak directly into UI components.

## Key Rules

- Server-only keys must never be exposed client-side.
- Provider calls must live behind server routes or server-only modules.
- Request validation must happen before vendor calls.
- Response normalization must happen before UI rendering.
- Error responses must not expose stack traces, secrets, tokens, raw provider payloads, or sensitive operational data.
- Cache, fallback, retry, and rate-limit behavior must be documented per provider before expanding provider usage.
- Provider integrations must not bypass billing, entitlement, auth, or RLS boundaries.

## Provider Documentation Requirement

Each provider doc should eventually define:

- Purpose
- Current implementation status
- Server/client boundary
- Required environment variables
- Request validation
- Normalized response shape
- Cache policy
- Rate-limit policy
- Fallback behavior
- Failure messages
- Sensitive data exclusions
- Manual verification steps

The current task creates only the API index. Full provider docs belong on separate branches.
