-- ORENZA tester onboarding: account creation does not send email OTP/confirmation.
-- Supabase Auth normally leaves email_confirmed_at null when email confirmation is enabled.
-- This trigger marks password-based email signups confirmed at creation time so the
-- registration form can create the account and establish a session immediately.

create or replace function public.orenza_auto_confirm_email_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and new.email_confirmed_at is null then
    new.email_confirmed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists orenza_auto_confirm_email_signup on auth.users;

create trigger orenza_auto_confirm_email_signup
  before insert on auth.users
  for each row
  execute function public.orenza_auto_confirm_email_signup();
