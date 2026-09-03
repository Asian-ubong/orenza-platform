-- Align the pre-existing ORENZA security_events table with the hardened
-- server-side security event contract.
alter table public.security_events
  add column if not exists severity text not null default 'INFO',
  add column if not exists request_id text,
  add column if not exists ip_hash text;

alter table public.security_events drop constraint if exists security_events_severity_check;
alter table public.security_events
  add constraint security_events_severity_check
  check (severity in ('INFO','LOW','MEDIUM','HIGH','CRITICAL'));

create index if not exists security_events_user_created_idx
  on public.security_events(user_id, created_at desc);
create index if not exists security_events_request_idx
  on public.security_events(request_id)
  where request_id is not null;
