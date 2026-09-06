create or replace function public.orenza_create_profit_payout(
  p_user_id uuid,
  p_amount numeric,
  p_currency text default 'USD',
  p_payout_method text default 'MANUAL',
  p_provider_adapter text default 'SANDBOX_DISABLED'
)
returns table (id uuid,payout_id text,request_id text,amount numeric,currency text,payout_method text,provider_adapter text,status text,created_at timestamptz,available_profit numeric)
language plpgsql security definer set search_path = public
as $$
declare
  v_wallet public.sandbox_wallets%rowtype;
  v_id uuid;
  v_payout_id text;
  v_request_id text;
  v_available numeric;
begin
  if p_user_id is null then raise exception 'USER_REQUIRED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if coalesce(trim(p_currency), '') = '' then raise exception 'INVALID_CURRENCY'; end if;
  select sw.* into v_wallet
  from public.sandbox_wallets sw
  where sw.user_id = p_user_id and sw.currency = upper(trim(p_currency))
  for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  v_available := greatest(coalesce(v_wallet.withdrawable_profit, 0) - coalesce(v_wallet.payout_reserved_profit, 0), 0);
  if p_amount > v_available then raise exception 'INSUFFICIENT_PROFIT'; end if;
  v_id := gen_random_uuid();
  v_payout_id := 'PAY-' || upper(substr(replace(v_id::text, '-', ''), 1, 12));
  v_request_id := 'REQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  update public.sandbox_wallets set payout_reserved_profit = coalesce(payout_reserved_profit, 0) + p_amount, updated_at = now() where id = v_wallet.id;
  insert into public.orenza_payout_requests (id,user_id,wallet_id,payout_id,request_id,amount,currency,payout_method,provider_adapter,status,metadata)
  values (v_id,p_user_id,v_wallet.id,v_payout_id,v_request_id,p_amount,upper(trim(p_currency)),upper(trim(p_payout_method)),upper(trim(p_provider_adapter)),'PENDING',jsonb_build_object('source','SANDBOX_PROFIT','execution','DISABLED'));
  return query select p.id,p.payout_id,p.request_id,p.amount,p.currency,p.payout_method,p.provider_adapter,p.status,p.created_at,greatest(coalesce(w.withdrawable_profit,0)-coalesce(w.payout_reserved_profit,0),0) from public.orenza_payout_requests p join public.sandbox_wallets w on w.id=p.wallet_id where p.id=v_id;
end;
$$;

create or replace function public.orenza_decide_profit_payout(p_payout_id uuid,p_actor_user_id uuid,p_decision text,p_reason text default null)
returns table (id uuid,status text,decision text,execution text)
language plpgsql security definer set search_path = public
as $$
declare
  v_payout public.orenza_payout_requests%rowtype;
  v_next text;
  v_decision text := upper(trim(coalesce(p_decision, '')));
  v_reason text := nullif(left(trim(coalesce(p_reason, '')), 500), '');
begin
  if p_payout_id is null or p_actor_user_id is null then raise exception 'INVALID_APPROVAL'; end if;
  if v_decision not in ('APPROVED','DECLINED') then raise exception 'INVALID_DECISION'; end if;
  select * into v_payout from public.orenza_payout_requests where id=p_payout_id for update;
  if not found then raise exception 'PAYOUT_NOT_FOUND'; end if;
  if v_payout.status <> 'PENDING' then raise exception 'PAYOUT_NOT_PENDING'; end if;
  v_next := case when v_decision='APPROVED' then 'PROCESSING' else 'REJECTED' end;
  update public.orenza_payout_requests set status=v_next, failed_at=case when v_next='REJECTED' then now() else failed_at end where id=v_payout.id;
  if v_decision='DECLINED' and v_payout.wallet_id is not null then
    update public.sandbox_wallets set payout_reserved_profit=greatest(coalesce(payout_reserved_profit,0)-v_payout.amount,0), updated_at=now() where id=v_payout.wallet_id;
  end if;
  insert into public.orenza_approval_audit(target_type,target_id,decision,actor_user_id,previous_status,new_status,reason) values ('PAYOUT',v_payout.id,v_decision,p_actor_user_id,'PENDING',v_next,v_reason);
  return query select v_payout.id,v_next,v_decision,'DISABLED'::text;
end;
$$;

revoke all on function public.orenza_create_profit_payout(uuid,numeric,text,text,text) from public,anon,authenticated;
revoke all on function public.orenza_decide_profit_payout(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.orenza_create_profit_payout(uuid,numeric,text,text,text) to service_role;
grant execute on function public.orenza_decide_profit_payout(uuid,uuid,text,text) to service_role;
