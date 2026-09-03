-- ORENZA live provider-chain foundation.
-- Real-money execution remains server-gated; this migration only adds durable
-- connection/worker synchronization state and does not enable trading or payout.

alter table public.broker_connections
  add column if not exists provider_account_reference text,
  add column if not exists scopes text[] not null default '{}',
  add column if not exists token_expires_at timestamptz,
  add column if not exists worker_status text not null default 'STOPPED',
  add column if not exists worker_last_heartbeat_at timestamptz,
  add column if not exists environment_guard text not null default 'DEMO';

create unique index if not exists broker_connections_provider_account_uq
  on public.broker_connections(broker_code, environment, provider_account_reference)
  where provider_account_reference is not null;

create table if not exists public.provider_sync_checkpoints (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.broker_connections(id) on delete cascade,
  stream text not null,
  cursor text,
  last_external_event_id text,
  last_observed_at timestamptz,
  status text not null default 'HEALTHY',
  error_message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connection_id, stream)
);

create table if not exists public.provider_sync_runs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.broker_connections(id) on delete set null,
  provider text not null,
  environment text not null,
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_seen integer not null default 0,
  records_applied integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'
);

create index if not exists provider_sync_runs_connection_idx
  on public.provider_sync_runs(connection_id, started_at desc);

create index if not exists broker_events_external_idx
  on public.broker_events(connection_id, external_event_id);

alter table public.provider_sync_checkpoints enable row level security;
alter table public.provider_sync_runs enable row level security;
