create table if not exists public.auth_email_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  purpose text not null check (purpose in ('signup','login')),
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists auth_email_otp_user_created_idx
  on public.auth_email_otp_challenges(user_id, created_at desc);

alter table public.auth_email_otp_challenges enable row level security;
