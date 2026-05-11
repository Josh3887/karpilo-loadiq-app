-- 007_legal_documents_and_acknowledgments.sql
-- Safe to rerun.
-- Purpose: legal document registry, acknowledgment audit, and disclaimer compatibility.

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,
  title text not null,
  version text not null,
  last_updated date,
  content_hash text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (document_type, version)
);

create table if not exists public.user_legal_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.legal_documents(id) on delete set null,
  document_type text not null,
  document_version text not null,
  acknowledged_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.disclaimer_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  disclaimer_version text not null,
  disclaimer_last_updated text,
  accepted_at timestamptz not null default now(),
  created_at timestamptz default now()
);
