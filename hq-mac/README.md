# Karpilo LoadIQ HQ — Mac continuation

Preserves the November 3 native workspace, device-owner lock, bundled templates, local
drafts and independent operator sign-in. Adds Web HQ as its initial section, embedding
https://hq.karpilo-liq.com with the existing web format and backend.
No provider secrets or Cognito tokens are injected into WebKit. Web authentication stays
separate, uses HTTPS Basic only for the exact HQ origin, has a three-attempt limit, and
stores no credentials on disk. WebKit uses an ephemeral data store. Locking destroys the
workspace; Reload / sign out recreates the web session. Navigation is restricted to the HQ origin and Vercel/GitHub/Google sign-in hosts.
HTTP Basic credentials are accepted only for the exact HQ origin; Vercel protection
remains enabled and requires the founder to sign in.

Build: sh hq-mac/build.sh. Requires the original private resource bundle copied into
hq-mac/build/Karpilo LoadIQ HQ.app. The ignored bundle contains existing template snapshots
and must not be committed. Original app and sources are preserved.

Web HQ inherits the current web deployment's development authentication limitations.
Production founder MFA/session/audit consolidation is still required. Existing native
operations API screens continue to use their original separate gateway and are not
falsely presented as migrated. No email/SMS sends are implemented by this change.
