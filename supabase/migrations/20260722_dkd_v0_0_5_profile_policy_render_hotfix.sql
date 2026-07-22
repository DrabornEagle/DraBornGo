begin;

update public.dkd_policy_center_config
set dkd_version_name_value = 'v0.0.5',
    dkd_version_code_value = 5,
    dkd_updated_at_value = now()
where dkd_id_value = 1;

do $dkd$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dkd_profiles'
      and column_name = 'dbg_id'
  ) then
    raise exception 'dkd_profile_hotfix_requires_dbg_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dkd_profiles'
      and column_name = 'ally_id'
  ) then
    raise exception 'dkd_profile_hotfix_legacy_ally_id_still_exists';
  end if;
end
$dkd$;

notify pgrst, 'reload schema';

commit;
