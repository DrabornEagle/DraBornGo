begin;

-- DraBornGo v0.0.8 security hardening.
-- Account deletion is an authenticated user action. These legacy compatibility
-- RPCs already resolve data through auth.uid(); anonymous EXECUTE is therefore
-- unnecessary and increases the exposed API surface.
revoke execute on function public.dkd_gate_cancel_account_deletion() from public, anon;
revoke execute on function public.dkd_gate_get_account_deletion_status() from public, anon;
revoke execute on function public.dkd_gate_request_account_deletion(text) from public, anon;

grant execute on function public.dkd_gate_cancel_account_deletion() to authenticated, service_role;
grant execute on function public.dkd_gate_get_account_deletion_status() to authenticated, service_role;
grant execute on function public.dkd_gate_request_account_deletion(text) to authenticated, service_role;

comment on function public.dkd_gate_cancel_account_deletion() is
  'DKD v0.0.8: authenticated account-deletion cancellation RPC; anonymous execution revoked.';
comment on function public.dkd_gate_get_account_deletion_status() is
  'DKD v0.0.8: authenticated account-deletion status RPC; anonymous execution revoked.';
comment on function public.dkd_gate_request_account_deletion(text) is
  'DKD v0.0.8: authenticated account-deletion request RPC; anonymous execution revoked.';

commit;
