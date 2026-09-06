create or replace function public.orenza_create_profit_payout(
  p_user_id uuid,
  p_amount numeric,
  p_currency text default 'USD',
  p_payout_method text default 'MANUAL',
  p_provider_adapter text default 'SANDBOX_DISABLED'
)
returns table(id uuid,payout_id text,request_id text,amount numeric,currency text,payout_method text,provider_adapter text,status text,created_at timestamptz,available_profit numeric)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_wallet public.sandbox_wallets%rowtype;
  v_id uuid;
  v_payout_id text;
  v_request_id text;
  v_available numeric;
begin
  if p_user_id is null then raise exception 'USER_REQUIRED'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'INVALID_AMOUNT'; end if;
  if coalesce(trim(p_currency),'')='' then raise exception 'INVALID_CURRENCY'; end if;
  select sw.* into v_wallet from public.sandbox_wallets sw where sw.user_id=p_user_id and sw.currency=upper(trim(p_currency)) for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  v_available:=greatest(coalesce(v_wallet.withdrawable_profit,0)-coalesce(v_wallet.payout_reserved_profit,0),0);
  if p_amount>v_available then raise exception 'INSUFFICIENT_PROFIT'; end if;
  v_id:=gen_random_uuid();
  v_payout_id:='PAY-'||upper(substr(replace(v_id::text,'-',''),1,12));
  v_request_id:='REQ-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  update public.sandbox_wallets sw set payout_reserved_profit=coalesce(sw.payout_reserved_profit,0)+p_amount,updated_at=now() where sw.id=v_wallet.id;
  insert into public.orenza_payout_requests(id,user_id,wallet_id,payout_id,request_id,amount,currency,payout_method,provider_adapter,status,metadata)
  values(v_id,p_user_id,v_wallet.id,v_payout_id,v_request_id,p_amount,upper(trim(p_currency)),upper(trim(p_payout_method)),upper(trim(p_provider_adapter)),'PENDING',jsonb_build_object('source','SANDBOX_PROFIT','execution','DISABLED'));
  return query
    select pr.id,pr.payout_id,pr.request_id,pr.amount,pr.currency,pr.payout_method,pr.provider_adapter,pr.status,pr.created_at,
           greatest(coalesce(sw.withdrawable_profit,0)-coalesce(sw.payout_reserved_profit,0),0)
    from public.orenza_payout_requests pr
    join public.sandbox_wallets sw on sw.id=pr.wallet_id
    where pr.id=v_id;
end;
$$;

revoke all on function public.orenza_create_profit_payout(uuid,numeric,text,text,text) from public,anon,authenticated;
