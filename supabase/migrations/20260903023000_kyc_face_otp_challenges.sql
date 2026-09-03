create table if not exists public.kyc_face_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists kyc_face_otp_challenges_user_created_idx
  on public.kyc_face_otp_challenges(user_id, created_at desc);

alter table public.kyc_face_otp_challenges enable row level security;

revoke all on public.kyc_face_otp_challenges from anon, authenticated;
