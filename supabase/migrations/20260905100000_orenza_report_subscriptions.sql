-- ORENZA operational email report subscriptions.
-- Server-only writes/reads are performed with the Supabase service key.
-- No public table policy is created; raw email addresses are not exposed to clients.
create table if not exists public.orenza_report_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null unique,
  verified_at timestamptz,
  enabled boolean not null default true,
  report_sources text[] not null default array['github','supabase','system']::text[],
  verification_token_hash text,
  unsubscribe_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_report_sent_at timestamptz
);

create index if not exists orenza_report_subscriptions_enabled_idx
  on public.orenza_report_subscriptions(enabled, verified_at);

alter table public.orenza_report_subscriptions enable row level security;

create or replace function public.orenza_report_subscriptions_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orenza_report_subscriptions_updated_at on public.orenza_report_subscriptions;
create trigger orenza_report_subscriptions_updated_at
before update on public.orenza_report_subscriptions
for each row execute function public.orenza_report_subscriptions_set_updated_at();

comment on table public.orenza_report_subscriptions is
  'Server-only operational email subscriptions for ORENZA GitHub/Supabase/system reports.';
