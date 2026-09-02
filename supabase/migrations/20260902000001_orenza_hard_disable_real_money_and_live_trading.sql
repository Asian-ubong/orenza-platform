create or replace function public.orenza_assert_sandbox_only_runtime()
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
    raise exception 'REAL_MONEY_DISABLED: Orenza is sandbox-only';
  end if;
end;
$$;

create or replace function public.orenza_block_real_trading_record()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if upper(coalesce(new.environment,'')) = 'REAL' then
    raise exception 'REAL_TRADING_DISABLED: live market trading is disabled';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orenza_block_real_trading_accounts on public.orenza_trading_accounts;
create trigger trg_orenza_block_real_trading_accounts
before insert or update on public.orenza_trading_accounts
for each row execute function public.orenza_block_real_trading_record();

drop trigger if exists trg_orenza_block_real_trading_results on public.orenza_trading_results;
create trigger trg_orenza_block_real_trading_results
before insert or update on public.orenza_trading_results
for each row execute function public.orenza_block_real_trading_record();

create or replace function public.orenza_finalize_profit_payout(
  p_payout_request_id uuid,
  p_status text,
  p_provider_reference text default null,
  p_message text default null
)
returns public.orenza_payout_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.orenza_payout_requests;
  v_wallet public.sandbox_wallets;
  v_user uuid;
begin
  if upper(coalesce(p_status,'')) = 'COMPLETED' then
    raise exception 'REAL_MONEY_PAYOUTS_DISABLED: payout completion is disabled';
  end if;

  select * into v_payout from public.orenza_payout_requests where id=p_payout_request_id for update;
  if not found then raise exception 'PAYOUT_NOT_FOUND'; end if;
  v_user := v_payout.user_id;
  if p_status not in ('FAILED','REVERSED','REJECTED','CANCELLED','UNDER_REVIEW') then raise exception 'INVALID_FINAL_PAYOUT_STATUS'; end if;

  select * into v_wallet from public.sandbox_wallets where user_id=v_user for update;
  if not found then raise exception 'SANDBOX_WALLET_NOT_FOUND'; end if;

  update public.orenza_payout_requests
  set status=p_status,
      provider_reference=coalesce(p_provider_reference,provider_reference),
      failed_at=case when p_status in ('FAILED','REJECTED','CANCELLED','REVERSED') then now() else failed_at end
  where id=p_payout_request_id
  returning * into v_payout;

  if p_status in ('FAILED','REJECTED','CANCELLED','REVERSED') then
    update public.sandbox_wallets
    set payout_reserved_profit=greatest(payout_reserved_profit-v_payout.amount,0),
        withdrawable_profit=withdrawable_profit+v_payout.amount,
        updated_at=now()
    where id=v_wallet.id;
  end if;

  insert into public.orenza_payout_events(payout_request_id,event_type,status,provider_reference,request_id,message,metadata)
  values(v_payout.id,'PROFIT_PAYOUT_FINALIZED',p_status,p_provider_reference,v_payout.request_id,p_message,jsonb_build_object('source','WITHDRAWABLE_PROFIT','real_money_execution',false));
  perform public.orenza_sandbox_append_audit(v_user,'PROFIT_PAYOUT_FINALIZED','PAYOUT_REQUEST',v_payout.id,v_payout.request_id,v_payout.amount,v_payout.currency,jsonb_build_object('status',p_status,'real_money_execution',false));
  return v_payout;
end;
$$;

update public.platform_runtime_controls
set sandbox_mode=true,
    real_payments_enabled=false,
    real_withdrawals_enabled=false,
    real_transfers_enabled=false,
    real_trading_enabled=false,
    real_profit_payout_enabled=false,
    updated_at=now()
where id=true;

update public.orenza_sandbox_treasury_config
set profit_payout_enabled=false,
    updated_at=now()
where id=true;
