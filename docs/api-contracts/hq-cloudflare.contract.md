# HQ Cloudflare read-only observations

## Official references (reviewed November 15, 2026)
- https://developers.cloudflare.com/api/resources/zones/methods/get/
- https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/list/
- https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

## Authentication and scope
Server-only CLOUDFLARE_API_TOKEN is loaded through getProviderConfig(), including
HQ_PROVIDER_SECRET_ARN. Environment overrides and the 60-second config cache apply.
Prepare a dashboard token with Zone / DNS / Read, limited to the six zone resources
below. Cloudflare lists DNS Read as accepted for both zone detail and DNS listing;
no write, account-wide, token-management, analytics or WAF permission is needed.
Token creation remains blocked on dashboard access and action-time confirmation.

| Zone | ID |
| --- | --- |
| karpilo-liq.com | 354a61884ea0777e1c8a1a8f01b8aa8a |
| karpiloendeavor.com | b8415789be0c168fb1ef529b2d473f18 |
| karpilofleetos.com | 1608ce26faf5c48a8723769c755355a5 |
| k-atls-aisystems.com | 7932894dfdad4636497fe9e4973e05e0 |
| project-alter-ego.com | 11e3c527f7d03d54b76805da733426db |
| zaharasworld.com | 36058f476f19b4c80ebea11186e565b0 |

Resources match the existing HQ monitored list; ownership/IDs must be verified in the
signed-in account before provisioning. No Global API key or extra scope is requested.

## Requests and consumed response fields
Bearer-authenticated GET /client/v4/zones/{id} consumes success, result.id/name/status,
paused, plan.name and name_servers. ID/name must match the monitored zone. GET
/client/v4/zones/{id}/dns_records?per_page=100&page=1 consumes success, result array,
id/type/name/content/proxied/ttl and result_info.total_pages/total_count. TXT content
is redacted. No raw errors, owner/member data, comments or tags reach the browser.
No token verification call substitutes for access to these actual endpoints.

## Errors, quotas, cache and privacy
HTTP 401/403 becomes access-denied; 429 rate-limited; transport or malformed responses
unavailable. Every zone reports zone and records scope separately. All actual scopes
successful means connected, mixed success partial, no successes error. Empty validated
arrays are real zero inventories; failed/malformed inventories remain null.
Connected means API access, not healthy DNS or an active zone.
The first page only is read; hasMore is true/false, or null when an inventory/continuation
cannot be established. No automatic pagination or retry. Twelve authenticated GETs
maximum per uncached refresh. 8.5-second API timeouts; redirects rejected.
Cache 60 seconds per warm process; errors 15 seconds (mixed partial observations 60).
No background polling or distributed rate-limit guarantee. Founder middleware remains
required; HTTP responses private/no-store. Secret-store failure returns generic 503.

Existing public CNAME/A queries use Cloudflare DNS-over-HTTPS and HEAD checks for four
fixed hosts. They never carry credentials. DNS success requires Status=0; empty answers
are not proof of an application endpoint. HTTP response reachability includes 401 and
redirects; HEAD does not follow redirects or prove application health. Failures affect
public coverage separately and cannot turn a denied private API into connected.
Analytics, WAF/security, TLS certificate inspection and billing remain not implemented.

## Source, tests and drift
hq-web/lib/cloudflare-read.mjs; hq-web/app/api/cloudflare/route.js;
hq-web/lib/provider-config.mjs; hq-web/lib/provider-cache.mjs; hq-web/app/page.jsx;
hq-web/tests/cloudflare-read.test.mjs.
Tests cover missing tokens, scope denial, partial access, malformed results, rate limits,
redaction, pagination and probe failure. Live private access awaits dashboard provisioning.
Drift risks: account ownership, fixed zone IDs, API permissions, response schemas and
pagination. Revalidate against official docs when any change.

### Product boundary — 2026-11-16
The runtime zone allowlist now contains only karpilo-liq.com. Public probes are apex, app and hq under that domain. Other company/project zones (including Argus) are neither fetched nor displayed. Existing token permissions were not broadened or changed. Zone/DNS API and error/pagination semantics above remain unchanged.
