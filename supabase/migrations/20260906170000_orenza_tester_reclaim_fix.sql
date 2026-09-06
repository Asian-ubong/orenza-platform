-- Repair tester promo re-claims for users who already have an expired/inactive
-- access row. The original unique(user_id) constraint means inserting a new
-- row after expiry can fail; update the existing row instead.
create or replace function public.orenza_claim_tester_invite(p_user_id uuid, p_code_hash text, p_access_token_hash text)
returns table(ok boolean, expires_at timestamptz, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.orenza_tester_invites;
  v_existing public.orenza_tester_access;
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

  select * into v_existing
  from public.orenza_tester_access as ta
  where ta.user_id = p_user_id
  for update;

  if found and v_existing.active = true and v_existing.started_at <= now() and v_existing.expires_at > now() then
    return query select true, v_existing.expires_at, 'TESTER_ACCESS_ALREADY_ACTIVE';
    return;
  end if;

  v_expires := least(v_invite.expires_at, now() + interval '14 days');

  if found then
    update public.orenza_tester_access
       set invite_id = v_invite.id,
           access_token_hash = p_access_token_hash,
           started_at = now(),
           expires_at = v_expires,
           active = true
     where id = v_existing.id;
  else
    insert into public.orenza_tester_access(user_id, invite_id, access_token_hash, started_at, expires_at, active)
    values(p_user_id, v_invite.id, p_access_token_hash, now(), v_expires, true);
  end if;

  update public.orenza_tester_invites
     set uses = uses + 1
   where id = v_invite.id;

  return query select true, v_expires, 'TESTER_ACCESS_GRANTED_FOR_14_DAYS';
end;
$$;

revoke all on function public.orenza_claim_tester_invite(uuid, text, text) from public;
grant execute on function public.orenza_claim_tester_invite(uuid, text, text) to authenticated;
