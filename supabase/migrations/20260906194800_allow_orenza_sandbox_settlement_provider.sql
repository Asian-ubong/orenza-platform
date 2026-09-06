alter table public.orenza_sandbox_trade_settlements drop constraint if exists orenza_sandbox_trade_settlements_provider_check;
alter table public.orenza_sandbox_trade_settlements add constraint orenza_sandbox_trade_settlements_provider_check check (provider = any(array['DERIV'::text,'MT5'::text,'ORENZA_SANDBOX'::text]));
