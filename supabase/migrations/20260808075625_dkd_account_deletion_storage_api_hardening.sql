create or replace function public.dkd_admin_account_deletion_storage_manifest(
  dkd_param_request_id_value uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth', 'storage'
as $function$
declare
  dkd_target_user_id_value uuid;
  dkd_objects_value jsonb := '[]'::jsonb;
begin
  if not public.dkd_is_admin() then
    raise exception 'dkd_admin_required';
  end if;

  select dkd_user_id_value into dkd_target_user_id_value
  from public.dkd_account_deletion_requests
  where dkd_id_value = dkd_param_request_id_value
    and dkd_status_value = 'pending';

  if dkd_target_user_id_value is null then
    raise exception 'dkd_account_deletion_request_not_found';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'dkd_bucket_id_value', dkd_storage_object_row.bucket_id,
    'dkd_object_name_value', dkd_storage_object_row.name
  ) order by dkd_storage_object_row.bucket_id, dkd_storage_object_row.name), '[]'::jsonb)
  into dkd_objects_value
  from storage.objects dkd_storage_object_row
  where dkd_storage_object_row.owner = dkd_target_user_id_value
     or dkd_storage_object_row.owner_id = dkd_target_user_id_value::text
     or dkd_storage_object_row.name = dkd_target_user_id_value::text
     or dkd_storage_object_row.name like dkd_target_user_id_value::text || '/%'
     or dkd_storage_object_row.name like '%/' || dkd_target_user_id_value::text || '/%';

  return jsonb_build_object(
    'dkd_target_user_id_value', dkd_target_user_id_value,
    'dkd_objects_value', dkd_objects_value
  );
end;
$function$;

create or replace function public.dkd_admin_approve_account_deletion(
  dkd_param_request_id_value uuid,
  dkd_param_admin_note_value text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth', 'storage'
as $function$
declare
  dkd_target_user_id_value uuid;
  dkd_column_record_value record;
  dkd_delete_sql_value text;
  dkd_deleted_public_rows_value integer := 0;
  dkd_deleted_auth_rows_value integer := 0;
  dkd_row_count_value integer := 0;
begin
  if not public.dkd_is_admin() then
    raise exception 'dkd_admin_required';
  end if;

  select dkd_user_id_value into dkd_target_user_id_value
  from public.dkd_account_deletion_requests
  where dkd_id_value = dkd_param_request_id_value
    and dkd_status_value = 'pending';

  if dkd_target_user_id_value is null then
    raise exception 'dkd_account_deletion_request_not_found';
  end if;

  if exists (
    select 1
    from storage.objects dkd_storage_object_row
    where dkd_storage_object_row.owner = dkd_target_user_id_value
       or dkd_storage_object_row.owner_id = dkd_target_user_id_value::text
       or dkd_storage_object_row.name = dkd_target_user_id_value::text
       or dkd_storage_object_row.name like dkd_target_user_id_value::text || '/%'
       or dkd_storage_object_row.name like '%/' || dkd_target_user_id_value::text || '/%'
  ) then
    raise exception 'dkd_account_deletion_storage_cleanup_required';
  end if;

  for dkd_column_record_value in
    select distinct
      dkd_columns_alias.table_schema,
      dkd_columns_alias.table_name,
      dkd_columns_alias.column_name
    from information_schema.columns dkd_columns_alias
    join information_schema.tables dkd_tables_alias
      on dkd_tables_alias.table_schema = dkd_columns_alias.table_schema
     and dkd_tables_alias.table_name = dkd_columns_alias.table_name
    where dkd_columns_alias.table_schema = 'public'
      and dkd_tables_alias.table_type = 'BASE TABLE'
      and dkd_columns_alias.table_name <> 'dkd_account_deletion_requests'
      and dkd_columns_alias.data_type = 'uuid'
      and dkd_columns_alias.column_name in (
        'user_id','dkd_user_id','dkd_user_id_value',
        'applicant_user_id','dkd_applicant_user_id_value',
        'customer_id','customer_user_id','dkd_customer_id_value','dkd_customer_user_id',
        'courier_id','courier_user_id','assigned_courier_user_id','dkd_courier_id_value','dkd_courier_user_id',
        'merchant_id','dkd_merchant_id_value','owner_id','dkd_owner_id_value',
        'buyer_id','buyer_user_id','dkd_buyer_id_value','seller_id','dkd_seller_id_value',
        'sender_id','sender_user_id','dkd_sender_id_value','dkd_sender_user_id','receiver_id','dkd_receiver_id_value',
        'requester_id','requester_user_id','addressee_id','target_user_id','dkd_target_user_id',
        'user_low','user_high','transporter_user_id','actor_user_id',
        'dkd_blocker_user_id','dkd_blocked_user_id','dkd_reporter_user_id','dkd_reported_user_id',
        'created_by','dkd_created_by_value','updated_by','dkd_updated_by_value'
      )
    order by
      case when dkd_columns_alias.table_name = 'dkd_profiles' then 9 else 1 end,
      dkd_columns_alias.table_name,
      dkd_columns_alias.column_name
  loop
    begin
      dkd_delete_sql_value := format(
        'delete from %I.%I where %I = $1',
        dkd_column_record_value.table_schema,
        dkd_column_record_value.table_name,
        dkd_column_record_value.column_name
      );
      execute dkd_delete_sql_value using dkd_target_user_id_value;
      get diagnostics dkd_row_count_value = row_count;
      dkd_deleted_public_rows_value := dkd_deleted_public_rows_value + coalesce(dkd_row_count_value, 0);
    exception when foreign_key_violation then
      null;
    end;
  end loop;

  delete from auth.users where id = dkd_target_user_id_value;
  get diagnostics dkd_deleted_auth_rows_value = row_count;
  if dkd_deleted_auth_rows_value <> 1 then
    raise exception 'dkd_account_deletion_auth_delete_failed';
  end if;

  delete from public.dkd_account_deletion_requests
  where dkd_user_id_value = dkd_target_user_id_value;

  return jsonb_build_object(
    'dkd_ok_value', true,
    'dkd_user_id_value', dkd_target_user_id_value,
    'dkd_deleted_public_rows_value', dkd_deleted_public_rows_value,
    'dkd_deleted_auth_rows_value', dkd_deleted_auth_rows_value
  );
end;
$function$;
