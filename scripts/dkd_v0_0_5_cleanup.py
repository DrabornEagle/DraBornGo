#!/usr/bin/env python3
from pathlib import Path

DKD_ROOT_PATH = Path(__file__).resolve().parents[1]
DKD_CURRENT_MIGRATION_RELATIVE_PATH = Path(
    'supabase/migrations/20260722133353_dkd_draborngo_v0_0_5_remove_draborndeal_and_fix_version.sql'
)


def dkd_replace_or_verify(dkd_relative_path, dkd_old_value, dkd_new_value):
    dkd_path_value = DKD_ROOT_PATH / dkd_relative_path
    dkd_text_value = dkd_path_value.read_text(encoding='utf-8')
    if dkd_old_value in dkd_text_value:
        dkd_path_value.write_text(
            dkd_text_value.replace(dkd_old_value, dkd_new_value),
            encoding='utf-8',
        )
        return
    if dkd_new_value not in dkd_text_value:
        raise SystemExit(
            f'DKD expected old or new text missing in {dkd_relative_path}: {dkd_old_value!r}'
        )


def dkd_update_visible_versions():
    dkd_replace_or_verify(
        'src/services/dkd_app_update_service.js',
        "  const dkd_native_build_value = dkd_update_number_value(Constants?.nativeBuildVersion, 0);\n"
        "  const dkd_expo_build_value = dkd_update_number_value(Constants?.expoConfig?.android?.versionCode, 0);\n"
        "  return dkd_native_build_value || dkd_expo_build_value || 5;",
        "  const dkd_expo_build_value = dkd_update_number_value(Constants?.expoConfig?.android?.versionCode, 0);\n"
        "  const dkd_native_build_value = dkd_update_number_value(Constants?.nativeBuildVersion, 0);\n"
        "  return dkd_expo_build_value || dkd_native_build_value || 5;",
    )
    dkd_replace_or_verify(
        'src/services/dkd_app_update_service.js',
        "  return dkd_update_text_value(Constants?.nativeAppVersion, dkd_update_text_value(Constants?.expoConfig?.version, '0.0.5'));",
        "  return dkd_update_text_value(Constants?.expoConfig?.version, dkd_update_text_value(Constants?.nativeAppVersion, '0.0.5'));",
    )
    dkd_replace_or_verify(
        'src/services/dkd_policy_center_service.js',
        "dkd_version_code_value: dkd_clean_policy_version_code_value(dkd_input_value.dkd_version_code_value || 4),",
        "dkd_version_code_value: dkd_clean_policy_version_code_value(dkd_input_value.dkd_version_code_value || 5),",
    )
    dkd_replace_or_verify(
        'src/features/legal/dkd_google_play_policy_center_modal.js',
        "  dkd_version_code_value: '4',",
        "  dkd_version_code_value: '5',",
    )

    dkd_active_paths_value = [
        DKD_ROOT_PATH / 'src',
        DKD_ROOT_PATH / 'web' / 'DraBornGo' / 'App',
        DKD_ROOT_PATH / 'app.json',
        DKD_ROOT_PATH / 'app.config.js',
        DKD_ROOT_PATH / 'package.json',
        DKD_ROOT_PATH / '.github' / 'workflows' / 'dkdev_build_apk.yml',
        DKD_ROOT_PATH / '.github' / 'workflows' / 'dkd_build_signed_apk.yml',
        DKD_ROOT_PATH / '.github' / 'workflows' / 'dkd_build_signed_aab.yml',
    ]
    dkd_text_suffix_values = {
        '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.html',
        '.yml', '.yaml', '.md', '.txt'
    }
    dkd_replacements_value = (
        ('v0.0.4', 'v0.0.5'),
        ('0.0.4', '0.0.5'),
        ('v0_0_4', 'v0_0_5'),
        ('code4', 'code5'),
        ('Kod 4', 'Kod 5'),
    )

    dkd_files_to_update_value = []
    for dkd_candidate_path_value in dkd_active_paths_value:
        if dkd_candidate_path_value.is_file():
            dkd_files_to_update_value.append(dkd_candidate_path_value)
        elif dkd_candidate_path_value.is_dir():
            dkd_files_to_update_value.extend(
                dkd_path_value
                for dkd_path_value in dkd_candidate_path_value.rglob('*')
                if dkd_path_value.is_file()
                and dkd_path_value.suffix.lower() in dkd_text_suffix_values
            )

    for dkd_path_value in sorted(set(dkd_files_to_update_value)):
        dkd_old_text_value = dkd_path_value.read_text(encoding='utf-8')
        dkd_new_text_value = dkd_old_text_value
        for dkd_old_value, dkd_new_value in dkd_replacements_value:
            dkd_new_text_value = dkd_new_text_value.replace(
                dkd_old_value,
                dkd_new_value,
            )
        if dkd_new_text_value != dkd_old_text_value:
            dkd_path_value.write_text(dkd_new_text_value, encoding='utf-8')

    dkd_old_doc_path_value = (
        DKD_ROOT_PATH / 'docs' / 'dkd_draborngo_apk_update_center_v0_0_4.md'
    )
    if dkd_old_doc_path_value.exists():
        dkd_old_doc_path_value.unlink()


def dkd_remove_draborndeal_supabase_files():
    dkd_supabase_roots_value = [
        DKD_ROOT_PATH / 'supabase' / 'migrations',
        DKD_ROOT_PATH / 'supabase' / 'sql',
        DKD_ROOT_PATH / 'supabase' / 'functions',
    ]
    dkd_current_migration_path_value = DKD_ROOT_PATH / DKD_CURRENT_MIGRATION_RELATIVE_PATH
    dkd_removed_paths_value = []

    for dkd_supabase_root_path_value in dkd_supabase_roots_value:
        if not dkd_supabase_root_path_value.exists():
            continue
        for dkd_path_value in sorted(dkd_supabase_root_path_value.rglob('*'), reverse=True):
            if not dkd_path_value.is_file():
                continue
            if dkd_path_value == dkd_current_migration_path_value:
                continue
            dkd_lower_path_value = str(dkd_path_value).lower()
            try:
                dkd_lower_text_value = dkd_path_value.read_text(
                    encoding='utf-8'
                ).lower()
            except UnicodeDecodeError:
                dkd_lower_text_value = ''
            if (
                'dkd_deal' in dkd_lower_path_value
                or 'draborndeal' in dkd_lower_path_value
                or 'dkd_deal_' in dkd_lower_text_value
                or 'draborndeal' in dkd_lower_text_value
                or 'v0_0_6' in dkd_lower_path_value
            ):
                dkd_removed_paths_value.append(
                    str(dkd_path_value.relative_to(DKD_ROOT_PATH))
                )
                dkd_path_value.unlink()

    return dkd_removed_paths_value


def dkd_write_current_cleanup_migration():
    dkd_migration_path_value = DKD_ROOT_PATH / DKD_CURRENT_MIGRATION_RELATIVE_PATH
    dkd_migration_path_value.parent.mkdir(parents=True, exist_ok=True)
    dkd_migration_path_value.write_text(
        r'''do $$
declare
  dkd_record_value record;
begin
  for dkd_record_value in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public' and tablename ilike 'dkd_deal%'
  loop
    execute format('drop table if exists %I.%I cascade', dkd_record_value.schemaname, dkd_record_value.tablename);
  end loop;

  for dkd_record_value in
    select schemaname, viewname
    from pg_views
    where schemaname = 'public' and viewname ilike 'dkd_deal%'
  loop
    execute format('drop view if exists %I.%I cascade', dkd_record_value.schemaname, dkd_record_value.viewname);
  end loop;

  for dkd_record_value in
    select schemaname, matviewname
    from pg_matviews
    where schemaname = 'public' and matviewname ilike 'dkd_deal%'
  loop
    execute format('drop materialized view if exists %I.%I cascade', dkd_record_value.schemaname, dkd_record_value.matviewname);
  end loop;

  for dkd_record_value in
    select n.nspname as dkd_schema_name_value,
           p.proname as dkd_function_name_value,
           pg_get_function_identity_arguments(p.oid) as dkd_arguments_value,
           p.prokind as dkd_prokind_value
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname ilike 'dkd_deal%'
  loop
    execute format(
      'drop %s if exists %I.%I(%s) cascade',
      case when dkd_record_value.dkd_prokind_value = 'p' then 'procedure' else 'function' end,
      dkd_record_value.dkd_schema_name_value,
      dkd_record_value.dkd_function_name_value,
      dkd_record_value.dkd_arguments_value
    );
  end loop;

  for dkd_record_value in
    select sequence_schema, sequence_name
    from information_schema.sequences
    where sequence_schema = 'public' and sequence_name ilike 'dkd_deal%'
  loop
    execute format('drop sequence if exists %I.%I cascade', dkd_record_value.sequence_schema, dkd_record_value.sequence_name);
  end loop;

  for dkd_record_value in
    select n.nspname as dkd_schema_name_value, t.typname as dkd_type_name_value
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname ilike 'dkd_deal%'
      and t.typtype in ('e', 'd', 'c')
  loop
    execute format('drop type if exists %I.%I cascade', dkd_record_value.dkd_schema_name_value, dkd_record_value.dkd_type_name_value);
  end loop;
end
$$;

delete from supabase_migrations.schema_migrations
where name ilike 'dkd_deal%';

update public.dkd_policy_center_config
set dkd_package_name_value = 'com.draborneagle.draborngo',
    dkd_version_name_value = 'v0.0.5',
    dkd_version_code_value = 5,
    dkd_updated_at_value = now()
where dkd_id_value = 1;
''',
        encoding='utf-8',
    )


def main():
    dkd_update_visible_versions()
    dkd_removed_paths_value = dkd_remove_draborndeal_supabase_files()
    dkd_write_current_cleanup_migration()
    print(
        f'DKD DraBornGo v0.0.5 cleanup complete; '
        f'removed {len(dkd_removed_paths_value)} DraBornDeal/obsolete Supabase files.'
    )
    for dkd_removed_path_value in dkd_removed_paths_value:
        print(f'  removed: {dkd_removed_path_value}')


if __name__ == '__main__':
    main()
