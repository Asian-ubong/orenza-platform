create table if not exists public.orenza_approval_audit (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  decision text not null check (decision in ('APPROVED','DECLINED')),
  actor_user_id uuid not null,
  previous_status text not null,
  new_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_orenza_approval_audit_target on public.orenza_approval_audit(target_type, target_id, created_at desc);
create index if not exists idx_orenza_approval_audit_actor on public.orenza_approval_audit(actor_user_id, created_at desc);

alter table public.orenza_approval_audit enable row level security;

create policy orenza_approval_audit_owner_select on public.orenza_approval_audit
  for select to authenticated
  using (actor_user_id = auth.uid());
