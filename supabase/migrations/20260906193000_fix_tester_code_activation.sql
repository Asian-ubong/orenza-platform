create or replace function public.orenza_claim_tester_invite(
  p_user_id uuid,
  p_code_hash text,
  p_access_token_hash text
)
returns table(ok boolean, expires_at timestamptz, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.orenza_tester_invites%rowtype;
  v_access public.orenza_tester_access%rowtype;
  v_expires timestamptz;
begin
  if auth.uid() is null or p_user_id is null or auth.uid() <> p_user_id then
    return query select false, null::timestamptz, 'UNAUTHORIZED';
    return;
  end if;

  if p_code_hash is null or length(trim(p_code_hash)) <> 64 then
    return query select false, null::timestamptz, 'INVALID_TESTER_CODE';
    return;
  end if;

  if p_access_token_hash is null or length(trim(p_access_token_hash)) <> 64 then
    return query select false, null::timestamptz, 'INVALID_ACCESS_TOKEN';
    return;
  end if;

  select * into v_invite
  from public.orenza_tester_invites
  where code_hash = lower(trim(p_code_hash))
    and active = true
    and starts_at <= now()
    and expires_at > now()
  for update;

  if not found then
    return query select false, null::timestamptz, 'INVALID_OR_EXPIRED_TESTER_CODE';
    return;
  end if;

  if v_invite.uses >= v_invite.max_uses then
    return query select false, null::timestamptz, 'TESTER_CODE_USAGE_LIMIT_REACHED';
    return;
  end if;

  select * into v_access
  from public.orenza_tester_access
  where user_id = p_user_id
  for update;

  if found and v_access.active = true and v_access.expires_at > now() then
    return query select true, v_access.expires_at, 'TESTER_ACCESS_ALREADY_ACTIVE';
    return;
  end if;

  v_expires := least(v_invite.expires_at, now() + interval '14 days');

  if found then
    update public.orenza_tester_access
    set invite_id = v_invite.id,
        access_token_hash = lower(trim(p_access_token_hash)),
        started_at = now(),
        expires_at = v_expires,
        active = true
    where id = v_access.id;
  else
    insert into public.orenza_tester_access(
      user_id, invite_id, access_token_hash, started_at, expires_at, active
    ) values (
      p_user_id, v_invite.id, lower(trim(p_access_token_hash)), now(), v_expires, true
    );
  end if;

  update public.orenza_tester_invites
  set uses = uses + 1
  where id = v_invite.id;

  return query select true, v_expires, 'TESTER_ACCESS_GRANTED_FOR_14_DAYS';
end;
$$;

revoke all on function public.orenza_claim_tester_invite(uuid,text,text) from public, anon;
grant execute on function public.orenza_claim_tester_invite(uuid,text,text) to authenticated;
