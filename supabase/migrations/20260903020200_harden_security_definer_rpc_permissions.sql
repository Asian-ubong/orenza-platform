-- Security RPCs are backend-only policy helpers. They must not be callable through
-- the PostgREST API by anonymous or ordinary authenticated clients.
revoke execute on function public.is_orenza_admin() from public;
revoke execute on function public.orenza_assert_sandbox_only_runtime() from public;
revoke execute on function public.orenza_live_runtime_status() from public;
