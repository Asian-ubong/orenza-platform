create table if not exists public.orenza_paystack_test_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reference text not null unique,
  paystack_transaction_id bigint,
  amount_subunit bigint not null check (amount_subunit > 0),
  currency text not null,
  email text not null,
  status text not null default 'INITIALIZED' check (status in ('INITIALIZED','ABANDONED','FAILED','ONGOING','PENDING','PROCESSING','SUCCESS','REVERSED')),
  authorization_url text,
  access_code text,
  verified_at timestamptz,
  fulfilled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orenza_paystack_test_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  reference text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_orenza_paystack_test_tx_user on public.orenza_paystack_test_transactions(user_id, created_at desc);
create index if not exists idx_orenza_paystack_test_tx_status on public.orenza_paystack_test_transactions(status, created_at desc);
create index if not exists idx_orenza_paystack_test_events_reference on public.orenza_paystack_test_events(reference, created_at desc);

alter table public.orenza_paystack_test_transactions enable row level security;
alter table public.orenza_paystack_test_events enable row level security;

create policy orenza_paystack_test_transactions_select_own
on public.orenza_paystack_test_transactions for select to authenticated
using (auth.uid() = user_id);

create policy orenza_paystack_test_events_select_none
on public.orenza_paystack_test_events for select to authenticated
using (false);

create or replace function public.orenza_assert_paystack_test_only()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_controls public.platform_runtime_controls%rowtype;
begin
  select * into v_controls from public.platform_runtime_controls where id=true;
  if not found then raise exception 'RUNTIME_CONTROLS_NOT_CONFIGURED'; end if;
  if not v_controls.sandbox_mode
     or v_controls.real_payments_enabled
     or v_controls.real_withdrawals_enabled
     or v_controls.real_transfers_enabled
     or v_controls.real_trading_enabled
     or v_controls.real_profit_payout_enabled then
    raise exception 'REAL_MONEY_DISABLED: Paystack integration requires sandbox-only runtime';
  end if;
end;
$$;
