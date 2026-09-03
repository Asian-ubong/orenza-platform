-- ORENZA Security / Secret Vault foundation v1.
-- Raw provider credentials are never exposed to clients. Secret material is
-- optional encrypted ciphertext only; the encryption key remains outside DB.

alter table public.orenza_private_access
  add column if not exists provider text,
  add column if not exists provider_account_reference text;

create index if not exists orenza_private_access_provider_ref_idx
  on public.orenza_private_access(provider, provider_account_reference)
  where provider is not null and provider_account_reference is not null;

create table if not exists public.secret_credentials (
  id uuid primary key default gen_random_uuid(),
  secret_ref text not null unique,
  service text not null,
  secret_type text not null,
  ciphertext text,
  fingerprint text,
  version integer not null default 1,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','ROTATED','REVOKED','EXPIRED','DISABLED')),
  expires_at timestamptz,
  last_rotated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oauth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null,
  state_hash text not null unique,
  encrypted_code_verifier text not null,
  redirect_uri text not null,
  scopes text[] not null default '{}',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_sessions_user_idx on public.oauth_sessions(user_id, created_at desc);
create index if not exists oauth_sessions_expiry_idx on public.oauth_sessions(expires_at);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_reference text not null unique,
  device_fingerprint text,
  ip_hash text,
  user_agent_hash text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','REVOKED','EXPIRED')),
  last_seen_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event_type text not null,
  severity text not null default 'INFO' check (severity in ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
  request_id text,
  ip_hash text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.api_request_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  user_id uuid,
  route text not null,
  method text not null,
  status_code integer,
  duration_ms integer,
  error_code text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.credential_rotations (
  id uuid primary key default gen_random_uuid(),
  secret_ref text not null references public.secret_credentials(secret_ref),
  previous_version integer,
  new_version integer not null,
  reason text,
  actor_user_id uuid,
  request_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.system_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_reference text not null unique,
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  status text not null default 'OPEN' check (status in ('OPEN','INVESTIGATING','MITIGATED','RESOLVED')),
  category text not null,
  summary text not null,
  request_id text,
  metadata jsonb not null default '{}',
  opened_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.secret_credentials enable row level security;
alter table public.oauth_sessions enable row level security;
alter table public.device_sessions enable row level security;
alter table public.security_events enable row level security;
alter table public.api_request_logs enable row level security;
alter table public.credential_rotations enable row level security;
alter table public.system_incidents enable row level security;

-- No client-facing policies are created on security/secret tables.
-- Access is server-side only through a restricted service identity.
