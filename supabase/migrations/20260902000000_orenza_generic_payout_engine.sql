create table if not exists public.orenza_payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  wallet_id uuid,
  payout_id text not null unique,
  request_id text not null unique,
  amount numeric(30,10) not null check (amount > 0),
  currency text not null,
  country_code text,
  region text,
  payout_method text not null,
  provider_adapter text not null,
  provider_reference text,
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','COMPLETED','FAILED','REJECTED','CANCELLED','REVERSED','UNDER_REVIEW')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.orenza_payout_events (
  id uuid primary key default gen_random_uuid(),
  payout_request_id uuid not null references public.orenza_payout_requests(id) on delete cascade,
  event_type text not null,
  status text,
  provider_reference text,
  request_id text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.orenza_payout_provider_adapters (
  id uuid primary key default gen_random_uuid(),
  adapter_key text not null unique,
  display_name text not null,
  country_codes text[] not null default '{}',
  enabled boolean not null default false,
  configuration_status text not null default 'UNCONFIGURED' check (configuration_status in ('UNCONFIGURED','CONFIGURED','DISABLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orenza_payout_requests_user on public.orenza_payout_requests(user_id, created_at desc);
create index if not exists idx_orenza_payout_requests_status on public.orenza_payout_requests(status, created_at desc);
create index if not exists idx_orenza_payout_events_request on public.orenza_payout_events(payout_request_id, created_at desc);

alter table public.orenza_payout_requests enable row level security;
alter table public.orenza_payout_events enable row level security;
alter table public.orenza_payout_provider_adapters enable row level security;

create policy orenza_payout_requests_select_own on public.orenza_payout_requests for select to authenticated using (auth.uid() = user_id);
create policy orenza_payout_events_select_own on public.orenza_payout_events for select to authenticated using (exists (select 1 from public.orenza_payout_requests p where p.id = payout_request_id and p.user_id = auth.uid()));
create policy orenza_payout_provider_adapters_select_enabled on public.orenza_payout_provider_adapters for select to authenticated using (enabled = true);
