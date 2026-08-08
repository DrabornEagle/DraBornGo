begin;

drop function if exists public.dkd_admin_courier_application_delete_value(bigint);
drop function if exists public.dkd_admin_courier_application_delete_value(text, uuid);

create or replace function public.dkd_admin_courier_application_delete_value(
  dkd_param_application_id text default null,
  dkd_param_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_application_id_value text := nullif(trim(coalesce(dkd_param_application_id, '')), '');
  dkd_user_id_value uuid := dkd_param_user_id;
  dkd_deleted_count_value integer := 0;
  dkd_deleted_user_id_value uuid;
  dkd_profile_reset_count_value integer := 0;
  dkd_has_online_column_value boolean := false;
begin
  if coalesce(public.dkd_is_admin(), false) is not true then
    raise exception 'admin_required';
  end if;

  if dkd_application_id_value is null and dkd_user_id_value is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'application_required'
    );
  end if;

  if to_regclass('public.dkd_courier_license_applications') is null then
    raise exception 'dkd_courier_license_applications_missing';
  end if;

  with dkd_deleted_rows_value as (
    delete from public.dkd_courier_license_applications as dkd_application_scope
    where (
      (dkd_application_id_value is not null and dkd_application_scope.id::text = dkd_application_id_value)
      or (dkd_application_id_value is null and dkd_user_id_value is not null and dkd_application_scope.user_id = dkd_user_id_value)
    )
    returning dkd_application_scope.user_id
  )
  select count(*)::integer, max(dkd_deleted_rows_value.user_id)
  into dkd_deleted_count_value, dkd_deleted_user_id_value
  from dkd_deleted_rows_value;

  if dkd_deleted_user_id_value is null then
    dkd_deleted_user_id_value := dkd_user_id_value;
  end if;

  if dkd_deleted_user_id_value is not null then
    update public.dkd_profiles as dkd_profile_scope
    set
      courier_status = 'none',
      updated_at = now()
    where dkd_profile_scope.user_id = dkd_deleted_user_id_value;

    get diagnostics dkd_profile_reset_count_value = row_count;

    select exists (
      select 1
      from information_schema.columns as dkd_column_scope
      where dkd_column_scope.table_schema = 'public'
        and dkd_column_scope.table_name = 'dkd_profiles'
        and dkd_column_scope.column_name = 'dkd_courier_online'
    )
    into dkd_has_online_column_value;

    if dkd_has_online_column_value then
      execute 'update public.dkd_profiles set dkd_courier_online = false, dkd_courier_last_online_at = now() where user_id = $1'
      using dkd_deleted_user_id_value;
    end if;
  end if;

  return jsonb_build_object(
    'ok', dkd_deleted_count_value > 0,
    'deleted_count', dkd_deleted_count_value,
    'user_id', dkd_deleted_user_id_value,
    'profile_reset_count', dkd_profile_reset_count_value,
    'deleted_at', now()
  );
end;
$$;

revoke all on function public.dkd_admin_courier_application_delete_value(text, uuid) from public;
grant execute on function public.dkd_admin_courier_application_delete_value(text, uuid) to authenticated;

comment on function public.dkd_admin_courier_application_delete_value(text, uuid) is 'Admin Kurye/Lojistik Masası içindeki kurye başvuru inceleme ekranından başvuru kaydı siler ve ilgili kurye lisans durumunu none yapar; kazanç/cüzdan alanlarına dokunmaz.';

commit;
