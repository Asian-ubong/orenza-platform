create extension if not exists pgcrypto;

create table if not exists public.orenza_tester_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text not null default 'REAL-LIFE TESTER',
  max_uses integer not null default 20 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orenza_tester_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invite_id uuid not null references public.orenza_tester_invites(id) on delete restrict,
  access_token_hash text not null unique,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_orenza_tester_access_user_active on public.orenza_tester_access(user_id, active, expires_at);

alter table public.orenza_tester_invites enable row level security;
alter table public.orenza_tester_access enable row level security;

drop policy if exists tester_access_self_read on public.orenza_tester_access;
create policy tester_access_self_read on public.orenza_tester_access
for select using (auth.uid() = user_id);

create or replace function public.orenza_tester_access_active(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orenza_tester_access
    where user_id = p_user_id and active = true
      and started_at <= now() and expires_at > now()
  );
$$;

create or replace function public.orenza_claim_tester_invite(p_user_id uuid, p_code_hash text, p_access_token_hash text)
returns table(ok boolean, expires_at timestamptz, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.orenza_tester_invites;
  v_expires timestamptz;
begin
  select * into v_invite
  from public.orenza_tester_invites
  where code_hash = p_code_hash and active = true
    and starts_at <= now() and expires_at > now()
  for update;

  if not found then
    return query select false, null::timestamptz, 'INVALID_OR_EXPIRED_TESTER_CODE';
    return;
  end if;

  if v_invite.uses >= v_invite.max_uses then
    return query select false, null::timestamptz, 'TESTER_CODE_USAGE_LIMIT_REACHED';
    return;
  end if;

  select expires_at into v_expires from public.orenza_tester_access where user_id = p_user_id and active = true;
  if v_expires is not null and v_expires > now() then
    return query select true, v_expires, 'TESTER_ACCESS_ALREADY_ACTIVE';
    return;
  end if;

  v_expires := least(v_invite.expires_at, now() + interval '14 days');
  insert into public.orenza_tester_access(user_id, invite_id, access_token_hash, started_at, expires_at)
  values(p_user_id, v_invite.id, p_access_token_hash, now(), v_expires);
  update public.orenza_tester_invites set uses = uses + 1 where id = v_invite.id;

  return query select true, v_expires, 'TESTER_ACCESS_GRANTED_FOR_14_DAYS';
end;
$$;

create or replace function public.orenza_assert_tester_access(p_user_id uuid, p_access_token_hash text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orenza_tester_access
    where user_id = p_user_id and access_token_hash = p_access_token_hash
      and active = true and started_at <= now() and expires_at > now()
  );
$$;

insert into public.orenza_tester_invites(code_hash, label, max_uses, expires_at)
values (encode(digest('ORENZA-74C74D6DE948744F', 'sha256'), 'hex'), 'REAL-LIFE TESTER PILOT', 20, now() + interval '14 days')
on conflict (code_hash) do nothing;
