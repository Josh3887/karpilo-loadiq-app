-- PHASE 3C OWNER SEED
-- REVIEWED SQL ONLY. DO NOT RUN UNTIL Phase 3B control-plane tables exist.
--
-- Target owner identity:
-- j.karpilo@karpiloloadiq.com
--
-- This seed:
-- - looks up an existing auth.users row by email
-- - does not create an auth user
-- - inserts one active global owner role only if missing
-- - records whether the seed inserted or skipped an existing active owner role
-- - includes verification and rollback SQL for manual Supabase SQL Editor use

-- ============================================================
-- OWNER ROLE SEED SQL
-- ============================================================

do $$
declare
  target_user_id uuid;
  target_role_id uuid;
  role_inserted boolean := false;
begin
  select id
  into target_user_id
  from auth.users
  where lower(email) = lower('j.karpilo@karpiloloadiq.com')
  limit 1;

  if target_user_id is null then
    raise notice 'No auth.users row found for j.karpilo@karpiloloadiq.com. No role inserted.';
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
      'seeded_for_email', 'j.karpilo@karpiloloadiq.com',
      'seed_name', 'phase_3c_owner_role_seed',
      'seeded_at', now()
    )
  where not exists (
    select 1
    from public.user_roles
    where user_id = target_user_id
      and role = 'owner'
      and scope = 'global'
      and status = 'active'
  )
  returning id into target_role_id;

  role_inserted := target_role_id is not null;

  if target_role_id is null then
    select id
    into target_role_id
    from public.user_roles
    where user_id = target_user_id
      and role = 'owner'
      and scope = 'global'
      and status = 'active'
    order by created_at desc
    limit 1;
  end if;

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
    'j.karpilo@karpiloloadiq.com',
    'owner',
    case
      when role_inserted then 'owner_role_seeded'
      else 'owner_role_seed_skipped_existing'
    end,
    'role_seed',
    'success',
    target_user_id,
    'user_roles',
    target_role_id,
    jsonb_build_object(
      'seeded_for_email', 'j.karpilo@karpiloloadiq.com',
      'seed_name', 'phase_3c_owner_role_seed',
      'role_inserted', role_inserted,
      'role', 'owner',
      'scope', 'global',
      'source', 'manual_seed',
      'reason', 'Initial founder control-plane access'
    )
  );
end $$;

-- ============================================================
-- VERIFICATION SQL
-- ============================================================

select
  u.id as auth_user_id,
  u.email,
  exists (
    select 1
    from public.users pu
    where pu.id = u.id
  ) as public_users_row_exists,
  exists (
    select 1
    from public.user_roles r
    where r.user_id = u.id
      and r.role = 'owner'
      and r.scope = 'global'
      and r.status = 'active'
      and (r.expires_at is null or r.expires_at > now())
  ) as active_global_owner_exists
from auth.users u
where lower(u.email) = lower('j.karpilo@karpiloloadiq.com');

select
  r.id as role_id,
  r.user_id,
  u.email,
  r.role,
  r.scope,
  r.status,
  r.source,
  r.reason,
  r.granted_at,
  r.revoked_at,
  r.expires_at,
  r.created_at,
  r.updated_at
from public.user_roles r
join auth.users u on u.id = r.user_id
where lower(u.email) = lower('j.karpilo@karpiloloadiq.com')
  and r.role = 'owner'
  and r.scope = 'global'
order by r.created_at desc;

select
  id,
  actor_email,
  actor_role,
  action,
  event_type,
  status,
  target_user_id,
  subject_table,
  subject_id,
  metadata,
  created_at
from public.admin_audit_events
where metadata->>'seed_name' = 'phase_3c_owner_role_seed'
  and metadata->>'seeded_for_email' = 'j.karpilo@karpiloloadiq.com'
order by created_at desc;

-- ============================================================
-- ROLLBACK SQL
-- ============================================================

do $$
declare
  target_user_id uuid;
  revoked_count integer := 0;
begin
  select id
  into target_user_id
  from auth.users
  where lower(email) = lower('j.karpilo@karpiloloadiq.com')
  limit 1;

  if target_user_id is null then
    raise notice 'No auth.users row found for j.karpilo@karpiloloadiq.com. No rollback needed.';
    return;
  end if;

  update public.user_roles
  set
    status = 'revoked',
    revoked_by = target_user_id,
    revoked_at = now(),
    reason = 'Initial founder control-plane access | Rolled back manual owner seed.'
  where user_id = target_user_id
    and role = 'owner'
    and scope = 'global'
    and status = 'active'
    and source = 'manual_seed'
    and reason = 'Initial founder control-plane access';

  get diagnostics revoked_count = row_count;

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
    'j.karpilo@karpiloloadiq.com',
    'owner',
    'owner_role_seed_rollback',
    'role_seed_rollback',
    'success',
    target_user_id,
    'user_roles',
    target_user_id,
    jsonb_build_object(
      'seeded_for_email', 'j.karpilo@karpiloloadiq.com',
      'seed_name', 'phase_3c_owner_role_seed',
      'revoked_count', revoked_count,
      'role', 'owner',
      'scope', 'global',
      'source', 'manual_seed'
    )
  );
end $$;

-- ============================================================
-- MANUAL SUPABASE STEPS
-- ============================================================

-- 1. Paste and run only the OWNER ROLE SEED SQL block in Supabase SQL Editor.
-- 2. Paste and run the VERIFICATION SQL block and confirm:
--    - auth user exists
--    - public.users row status is visible
--    - active_global_owner_exists is true
--    - owner/global/active role exists
--    - role_seed audit event exists
-- 3. Use the ROLLBACK SQL block only if you need to revoke this exact manual_seed owner role.
