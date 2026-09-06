-- ORENZA account creation: no email OTP/confirmation step.
-- Keep the trigger function private so anonymous clients cannot call it via PostgREST.

create schema if not exists private;

drop trigger if exists orenza_auto_confirm_email_signup on auth.users;
drop function if exists public.orenza_auto_confirm_email_signup();

create or replace function private.orenza_auto_confirm_email_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

revoke all on function private.orenza_auto_confirm_email_signup() from public, anon, authenticated;
grant execute on function private.orenza_auto_confirm_email_signup() to postgres;

create trigger orenza_auto_confirm_email_signup
  before insert on auth.users
  for each row
  execute function private.orenza_auto_confirm_email_signup();
