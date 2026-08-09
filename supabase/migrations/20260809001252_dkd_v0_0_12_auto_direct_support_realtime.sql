create or replace function public.dkd_ensure_direct_admin_support_thread_dkd()
returns trigger
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
begin
  if exists(select 1 from public.dkd_admin_users a where a.user_id=new.user_id) then
    return new;
  end if;
  if not exists(select 1 from public.dkd_support_threads t where t.dkd_user_id=new.user_id and t.dkd_topic_key='dkd_direct_admin') then
    insert into public.dkd_support_threads(
      dkd_user_id,dkd_ticket_code,dkd_topic_key,dkd_topic_title,dkd_priority_key,dkd_status_key,dkd_status_title,dkd_source_key,dkd_last_message_text,dkd_needs_admin_reply,dkd_admin_needed
    ) values (
      new.user_id,
      'DKD-CHAT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
      'dkd_direct_admin','DrabornEagle Destek','dkd_normal','dkd_open','DrabornEagle destek hattı','dkd_auto_direct_support','',false,false
    );
  end if;
  return new;
end;
$function$;

drop trigger if exists dkd_profiles_ensure_direct_admin_support_ai on public.dkd_profiles;
create trigger dkd_profiles_ensure_direct_admin_support_ai
after insert on public.dkd_profiles
for each row execute function public.dkd_ensure_direct_admin_support_thread_dkd();

insert into public.dkd_support_threads(
  dkd_user_id,dkd_ticket_code,dkd_topic_key,dkd_topic_title,dkd_priority_key,dkd_status_key,dkd_status_title,dkd_source_key,dkd_last_message_text,dkd_needs_admin_reply,dkd_admin_needed
)
select p.user_id,
       'DKD-CHAT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
       'dkd_direct_admin','DrabornEagle Destek','dkd_normal','dkd_open','DrabornEagle destek hattı','dkd_auto_direct_support','',false,false
from public.dkd_profiles p
where not exists(select 1 from public.dkd_admin_users a where a.user_id=p.user_id)
  and not exists(select 1 from public.dkd_support_threads t where t.dkd_user_id=p.user_id and t.dkd_topic_key='dkd_direct_admin');

do $dkd$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='dkd_support_messages') then
    alter publication supabase_realtime add table public.dkd_support_messages;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='dkd_support_threads') then
    alter publication supabase_realtime add table public.dkd_support_threads;
  end if;
end
$dkd$;
