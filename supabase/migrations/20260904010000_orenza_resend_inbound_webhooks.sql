-- Resend inbound email webhook event ledger.
-- Server-only table: raw email content is intentionally not stored here.
create table if not exists public.resend_inbound_events (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text not null unique,
  message_id text,
  sender text,
  recipients text[] not null default '{}',
  subject text,
  received_at timestamptz,
  event_created_at timestamptz,
  payload_hash text not null,
  processed_at timestamptz,
  processing_status text not null default 'RECEIVED'
    check (processing_status in ('RECEIVED','PROCESSED','FAILED','IGNORED')),
  error_message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resend_inbound_events_created_idx
  on public.resend_inbound_events(created_at desc);
create index if not exists resend_inbound_events_status_idx
  on public.resend_inbound_events(processing_status, created_at desc);

alter table public.resend_inbound_events enable row level security;
-- No client policies: inbound email events are server-side only.
