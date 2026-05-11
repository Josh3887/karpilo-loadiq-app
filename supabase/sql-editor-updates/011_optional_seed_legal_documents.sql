-- 011_optional_seed_legal_documents.sql
-- Safe to rerun.
-- Purpose: optional reference rows for app limits and legal document registry.

insert into public.usage_limits (
  tier,
  monthly_calculations,
  saved_loads,
  exports_allowed,
  advanced_analytics_allowed,
  comparisons_allowed,
  templates_allowed
)
values
  ('free', 10, 0, false, false, false, false),
  ('pro', null, null, true, true, true, true),
  ('founder', null, null, true, true, true, true),
  ('pilot', null, null, true, true, true, true)
on conflict (tier) do update set
  monthly_calculations = excluded.monthly_calculations,
  saved_loads = excluded.saved_loads,
  exports_allowed = excluded.exports_allowed,
  advanced_analytics_allowed = excluded.advanced_analytics_allowed,
  comparisons_allowed = excluded.comparisons_allowed,
  templates_allowed = excluded.templates_allowed;

insert into public.legal_documents (
  document_type,
  title,
  version,
  last_updated,
  metadata
)
values
  ('terms_of_service', 'Terms of Service', '2026-05-11', '2026-05-11', '{"route":"/terms"}'::jsonb),
  ('privacy_policy', 'Privacy Policy', '2026-05-11', '2026-05-11', '{"route":"/privacy"}'::jsonb),
  ('refund_policy', 'Refund Policy', '2026-05-11', '2026-05-11', '{"route":"/refund-policy"}'::jsonb),
  ('subscription_terms', 'Subscription Terms', '2026-05-11', '2026-05-11', '{"route":"/subscription-terms"}'::jsonb),
  ('disclaimer', 'LoadIQ First-Launch Disclaimer', 'loadiq-disclaimer-v1', '2026-05-11', '{"component":"DisclaimerModal"}'::jsonb),
  ('data_sources', 'Data Source Disclosure', '2026-05-11', '2026-05-11', '{"providers":["EIA"]}'::jsonb)
on conflict (document_type, version) do update set
  title = excluded.title,
  last_updated = excluded.last_updated,
  metadata = excluded.metadata,
  is_active = true,
  updated_at = now();
