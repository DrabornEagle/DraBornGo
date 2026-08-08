-- DraBornGo v0.0.6
-- Keep account-deletion RPC execution limited to signed-in users and trusted server roles.

revoke execute on function public.dkd_request_account_deletion(uuid,text,text,text) from public, anon;
revoke execute on function public.dkd_my_account_deletion_request() from public, anon;
revoke execute on function public.dkd_cancel_account_deletion_request(uuid) from public, anon;
revoke execute on function public.dkd_admin_account_deletion_requests_list() from public, anon;
revoke execute on function public.dkd_admin_account_deletion_storage_manifest(uuid) from public, anon;
revoke execute on function public.dkd_admin_approve_account_deletion(uuid,text) from public, anon;
revoke execute on function public.dkd_admin_reject_account_deletion(uuid,text) from public, anon;

grant execute on function public.dkd_request_account_deletion(uuid,text,text,text) to authenticated, service_role;
grant execute on function public.dkd_my_account_deletion_request() to authenticated, service_role;
grant execute on function public.dkd_cancel_account_deletion_request(uuid) to authenticated, service_role;
grant execute on function public.dkd_admin_account_deletion_requests_list() to authenticated, service_role;
grant execute on function public.dkd_admin_account_deletion_storage_manifest(uuid) to authenticated, service_role;
grant execute on function public.dkd_admin_approve_account_deletion(uuid,text) to authenticated, service_role;
grant execute on function public.dkd_admin_reject_account_deletion(uuid,text) to authenticated, service_role;
