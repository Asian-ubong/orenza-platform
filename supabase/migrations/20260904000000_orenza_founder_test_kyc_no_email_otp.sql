-- Founder test path: KYC evidence collection does not require an Orenza email OTP.
-- This migration intentionally does NOT approve KYC, enable real trading, enable
-- withdrawals, enable transfers, or enable profit payouts.
-- Real-money gates remain controlled by platform_runtime_controls.

create or replace function public.get_orenza_founder_kyc_mode()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'enabled', true,
    'email_otp_required', false,
    'approval_mode', 'HUMAN_REVIEW_REQUIRED',
    'identity_provider_required_for_approval', true,
    'real_money_unlocked', false
  );
$$;

revoke all on function public.get_orenza_founder_kyc_mode() from public;
grant execute on function public.get_orenza_founder_kyc_mode() to authenticated;
