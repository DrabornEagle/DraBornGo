-- DraBornGo v0.0.6 / Android versionCode 6
-- Google Play policy metadata sync + SECURITY DEFINER admin RPC hardening.

begin;

update public.dkd_policy_center_config
set
  dkd_privacy_policy_doc_url_value = 'https://www.draborneagle.com/draborngo/privacy/',
  dkd_account_deletion_form_url_value = 'https://www.draborneagle.com/draborngo/account-deletion/',
  dkd_package_name_value = 'com.draborneagle.draborngo',
  dkd_version_name_value = 'v0.0.6',
  dkd_version_code_value = 6,
  dkd_updated_at_value = now()
where dkd_id_value = 1;

create or replace function public.dkd_admin_list_notification_templates()
returns table (
  dkd_template_key text,
  dkd_label text,
  dkd_description text,
  dkd_title text,
  dkd_body text,
  dkd_target_screen text,
  dkd_is_enabled boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.role() <> 'service_role' and not coalesce(public.dkd_is_admin(), false) then
    raise exception 'dkd_admin_required';
  end if;

  return query
  select
    dkd_template_alias.dkd_template_key,
    dkd_template_alias.dkd_label,
    dkd_template_alias.dkd_description,
    dkd_template_alias.dkd_title,
    dkd_template_alias.dkd_body,
    dkd_template_alias.dkd_target_screen,
    dkd_template_alias.dkd_is_enabled,
    dkd_template_alias.updated_at
  from public.dkd_notification_templates as dkd_template_alias
  order by
    case dkd_template_alias.dkd_template_key
      when 'cargo_courier_accepted' then 10
      when 'cargo_courier_picked_up' then 20
      when 'cargo_courier_completed' then 30
      when 'merchant_courier_accepted' then 40
      when 'merchant_courier_picked_up' then 50
      when 'merchant_courier_completed' then 60
      when 'social_message' then 70
      when 'friend_request' then 80
      else 999
    end,
    dkd_template_alias.dkd_template_key asc;
end;
$$;

create or replace function public.dkd_admin_upsert_notification_template(
  dkd_param_template_key text,
  dkd_param_label text,
  dkd_param_description text,
  dkd_param_title text,
  dkd_param_body text,
  dkd_param_target_screen text,
  dkd_param_is_enabled boolean
)
returns public.dkd_notification_templates
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_result_row_value public.dkd_notification_templates;
begin
  if auth.role() <> 'service_role' and not coalesce(public.dkd_is_admin(), false) then
    raise exception 'dkd_admin_required';
  end if;

  insert into public.dkd_notification_templates (
    dkd_template_key,
    dkd_label,
    dkd_description,
    dkd_title,
    dkd_body,
    dkd_target_screen,
    dkd_is_enabled,
    updated_at
  ) values (
    dkd_param_template_key,
    coalesce(nullif(trim(dkd_param_label), ''), dkd_param_template_key),
    nullif(trim(coalesce(dkd_param_description, '')), ''),
    nullif(trim(coalesce(dkd_param_title, '')), ''),
    nullif(trim(coalesce(dkd_param_body, '')), ''),
    coalesce(nullif(trim(coalesce(dkd_param_target_screen, '')), ''), 'map'),
    coalesce(dkd_param_is_enabled, true),
    now()
  )
  on conflict (dkd_template_key)
  do update set
    dkd_label = coalesce(
      nullif(trim(excluded.dkd_label), ''),
      public.dkd_notification_templates.dkd_label,
      public.dkd_notification_templates.dkd_template_key
    ),
    dkd_description = coalesce(
      nullif(trim(excluded.dkd_description), ''),
      public.dkd_notification_templates.dkd_description
    ),
    dkd_title = excluded.dkd_title,
    dkd_body = excluded.dkd_body,
    dkd_target_screen = excluded.dkd_target_screen,
    dkd_is_enabled = excluded.dkd_is_enabled,
    updated_at = now()
  returning * into dkd_result_row_value;

  return dkd_result_row_value;
end;
$$;

revoke all privileges on function public.dkd_admin_list_notification_templates() from public, anon;
grant execute on function public.dkd_admin_list_notification_templates() to authenticated, service_role;

revoke all privileges on function public.dkd_admin_upsert_notification_template(text, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.dkd_admin_upsert_notification_template(text, text, text, text, text, text, boolean) to authenticated, service_role;

-- These DraBornGate-compatible admin functions already validate the caller inside
-- the function body, but anonymous EXECUTE grants are unnecessary attack surface.
revoke all privileges on function public.dkd_gate_admin_update_courier_plan(text, text, text, numeric, numeric, numeric, integer, boolean, boolean, boolean, text, text, text, text, boolean, boolean) from public, anon;
grant execute on function public.dkd_gate_admin_update_courier_plan(text, text, text, numeric, numeric, numeric, integer, boolean, boolean, boolean, text, text, text, text, boolean, boolean) to authenticated, service_role;

revoke all privileges on function public.dkd_gate_admin_update_site_plan(text, text, text, numeric, numeric, numeric, integer, integer, integer, integer, integer, boolean, text, text, text, text, boolean, boolean) from public, anon;
grant execute on function public.dkd_gate_admin_update_site_plan(text, text, text, numeric, numeric, numeric, integer, integer, integer, integer, integer, boolean, text, text, text, text, boolean, boolean) to authenticated, service_role;

commit;
