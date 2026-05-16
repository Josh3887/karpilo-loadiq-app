-- PHASE 3C OWNER SEED
-- REVIEWED SQL ONLY. DO NOT RUN UNTIL Phase 3B control-plane tables exist.
--
-- Target owner identity:
-- josh.karpilo@loadiq.com
--
-- This seed:
-- - looks up an existing auth.users row by email
-- - does not create an auth user
-- - inserts one active global owner role only if missing
-- - records the seed attempt in admin_audit_events

-- ============================================================
-- OWNER ROLE SEED
-- ============================================================

do $$
declare
  target_user_id uuid;
  role_inserted integer := 0;
begin
  select id
  into target_user_id
  from auth.users
  where lower(email) = lower('josh.karpilo@loadiq.com')
  limit 1;

  if target_user_id is null then
    raise notice 'No auth.users row found for josh.karpilo@loadiq.com. No role inserted.';
    return;
  end if;

  insert into public.user_roles (
    user_id,
    role,
    scope,
    status,
    source,
    reason,
    metadata
  )
  select
    target_user_id,
    'owner',
    'global',
    'active',
    'manual_seed',
    'Initial founder control-plane access',
    jsonb_build_object(
      'seeded_for_email', 'josh.karpilo@loadiq.com',
      'seed_name', 'phase_3c_owner_role_seed'
    )
  where not exists (
    select 1
    from public.user_roles
    where user_id = target_user_id
      and role = 'owner'
      and scope = 'global'
      and status = 'active'
  );

  get diagnostics role_inserted = row_count;

  insert into public.admin_audit_events (
    actor_user_id,
    actor_email,
    actor_role,
    action,
    event_type,
    status,
    target_user_id,
    subject_table,
    subject_id,
    metadata
  )
  values (
    target_user_id,
    'josh.karpilo@loadiq.com',
    'owner',
    case
      when role_inserted = 1 then 'owner_role_seeded'
      else 'owner_role_seed_skipped_existing'
    end,
    'role_seed',
    'success',
    target_user_id,
    'user_roles',
    target_user_id,
    jsonb_build_object(
      'seeded_for_email', 'josh.karpilo@loadiq.com',
      'seed_name', 'phase_3c_owner_role_seed',
      'role_inserted', role_inserted = 1,
      'scope', 'global',
      'source', 'manual_seed',
      'reason', 'Initial founder control-plane access'
    )
  );
end $$;

-- ============================================================
-- VERIFICATION
-- ============================================================

select
  u.id as user_id,
  u.email,
  r.role,
  r.scope,
  r.status,
  r.source,
  r.reason,
  r.granted_at,
  r.created_at
from auth.users u
left join public.user_roles r on r.user_id = u.id
where lower(u.email) = lower('josh.karpilo@loadiq.com')
order by r.created_at desc;

select
  actor_email,
  actor_role,
  action,
  event_type,
  status,
  target_user_id,
  subject_table,
  metadata,
  created_at
from public.admin_audit_events
where metadata->>'seed_name' = 'phase_3c_owner_role_seed'
   or metadata->>'seeded_for_email' = 'josh.karpilo@loadiq.com'
order by created_at desc;

-- ============================================================
-- ROLLBACK
-- ============================================================

do $$
declare
  target_user_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where lower(email) = lower('josh.karpilo@loadiq.com')
  limit 1;

  if target_user_id is null then
    raise notice 'No auth.users row found for josh.karpilo@loadiq.com. No rollback needed.';
    return;
  end if;

  update public.user_roles
  set
    status = 'revoked',
    revoked_by = target_user_id,
    revoked_at = now(),
    reason = coalesce(reason, '') || ' | Rolled back manual owner seed.'
  where user_id = target_user_id
    and role = 'owner'
    and scope = 'global'
    and status = 'active'
    and source = 'manual_seed'
    and reason = 'Initial founder control-plane access';

  insert into public.admin_audit_events (
    actor_user_id,
    actor_email,
    actor_role,
    action,
    event_type,
    status,
    target_user_id,
    subject_table,
    subject_id,
    metadata
  )
  values (
    target_user_id,
    'josh.karpilo@loadiq.com',
    'owner',
    'owner_role_seed_rollback',
    'role_seed_rollback',
    'success',
    target_user_id,
    'user_roles',
    target_user_id,
    jsonb_build_object(
      'seeded_for_email', 'josh.karpilo@loadiq.com',
      'seed_name', 'phase_3c_owner_role_seed',
      'scope', 'global',
      'source', 'manual_seed'
    )
  );
end $$;
