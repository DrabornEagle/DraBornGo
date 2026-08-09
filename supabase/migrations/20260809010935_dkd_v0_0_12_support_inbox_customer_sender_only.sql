create or replace function public.dkd_support_admin_threads_dkd(
  dkd_param_search text default '',
  dkd_param_limit integer default 80
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public','auth'
as $function$
declare
  dkd_result_value jsonb;
  dkd_search_value text := trim(coalesce(dkd_param_search,''));
begin
  if not public.dkd_is_admin() then raise exception 'dkd_admin_required'; end if;

  select coalesce(jsonb_agg(to_jsonb(dkd_row_value) order by dkd_row_value.dkd_sort_at desc),'[]'::jsonb)
  into dkd_result_value
  from (
    select
      t.dkd_id as dkd_thread_id,
      t.dkd_user_id,
      t.dkd_ticket_code,
      t.dkd_status_key,
      t.dkd_status_title,
      t.dkd_last_message_text,
      t.dkd_created_at,
      t.dkd_updated_at,
      coalesce(p.nickname,'Kullanıcı') as dkd_nickname,
      coalesce(p.dbg_id,'') as dkd_dbg_id,
      coalesce(u.email,'') as dkd_email,
      coalesce(u.phone,'') as dkd_phone,
      coalesce(nullif(p.avatar_image_url,''),nullif(p.profile_image_url,''),'') as dkd_avatar_image_url,
      exists(select 1 from public.dkd_support_messages m where m.dkd_thread_id=t.dkd_id) as dkd_has_messages,
      exists(select 1 from public.dkd_support_messages m where m.dkd_thread_id=t.dkd_id and lower(coalesce(m.dkd_sender_key,'')) in ('dkd_customer','dkd_user')) as dkd_has_customer_messages,
      coalesce((select max(m.dkd_created_at) from public.dkd_support_messages m where m.dkd_thread_id=t.dkd_id),t.dkd_updated_at,t.dkd_created_at) as dkd_sort_at
    from public.dkd_support_threads t
    left join public.dkd_profiles p on p.user_id=t.dkd_user_id
    left join auth.users u on u.id=t.dkd_user_id
    where t.dkd_topic_key='dkd_direct_admin'
      and (
        (dkd_search_value='' and exists(
          select 1
          from public.dkd_support_messages m
          where m.dkd_thread_id=t.dkd_id
            and lower(coalesce(m.dkd_sender_key,'')) in ('dkd_customer','dkd_user')
        ))
        or
        (dkd_search_value<>'' and (
          coalesce(p.nickname,'') ilike '%'||dkd_search_value||'%'
          or coalesce(u.email,'') ilike '%'||dkd_search_value||'%'
          or coalesce(u.phone,'') ilike '%'||dkd_search_value||'%'
          or coalesce(p.dbg_id,'') ilike '%'||dkd_search_value||'%'
          or t.dkd_user_id::text ilike '%'||dkd_search_value||'%'
        ))
      )
    order by
      case when coalesce(t.dkd_needs_admin_reply,false) or coalesce(t.dkd_admin_needed,false) then 0 else 1 end,
      coalesce((select max(m.dkd_created_at) from public.dkd_support_messages m where m.dkd_thread_id=t.dkd_id),t.dkd_updated_at,t.dkd_created_at) desc
    limit least(greatest(coalesce(dkd_param_limit,80),1),200)
  ) dkd_row_value;

  return coalesce(dkd_result_value,'[]'::jsonb);
end;
$function$;

grant execute on function public.dkd_support_admin_threads_dkd(text,integer) to authenticated;
