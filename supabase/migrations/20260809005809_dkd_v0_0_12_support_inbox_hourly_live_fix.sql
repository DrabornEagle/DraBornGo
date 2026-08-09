-- DraBornGo v0.0.12 UI/support hotfix: sane hourly rate + support inbox behavior.

insert into public.dkd_support_threads(
  dkd_user_id,dkd_ticket_code,dkd_topic_key,dkd_topic_title,dkd_priority_key,
  dkd_status_key,dkd_status_title,dkd_source_key,dkd_last_message_text,
  dkd_needs_admin_reply,dkd_admin_needed
)
select p.user_id,
       'DKD-CHAT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
       'dkd_direct_admin','DrabornEagle Destek','dkd_normal',
       'dkd_open','DrabornEagle destek hattı','dkd_auto_direct_support','',false,false
from public.dkd_profiles p
where not exists(select 1 from public.dkd_admin_users a where a.user_id=p.user_id)
  and not exists(select 1 from public.dkd_support_threads t where t.dkd_user_id=p.user_id and t.dkd_topic_key='dkd_direct_admin');

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
      coalesce((select max(m.dkd_created_at) from public.dkd_support_messages m where m.dkd_thread_id=t.dkd_id),t.dkd_updated_at,t.dkd_created_at) as dkd_sort_at
    from public.dkd_support_threads t
    left join public.dkd_profiles p on p.user_id=t.dkd_user_id
    left join auth.users u on u.id=t.dkd_user_id
    where t.dkd_topic_key='dkd_direct_admin'
      and (
        (dkd_search_value='' and exists(select 1 from public.dkd_support_messages m where m.dkd_thread_id=t.dkd_id))
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

create or replace function public.dkd_courier_earnings_summary_dkd(dkd_param_user_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public','auth'
as $function$
declare
  dkd_auth_user_id uuid := auth.uid();
  dkd_target_user_id uuid := coalesce(dkd_param_user_id,auth.uid());
  dkd_is_admin_value boolean := coalesce(public.dkd_is_admin(),false);
  dkd_day_start timestamptz := (date_trunc('day',now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul');
  dkd_week_start timestamptz := (date_trunc('week',now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul');
  dkd_month_start timestamptz := (date_trunc('month',now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul');
  dkd_result_value jsonb;
begin
  if dkd_auth_user_id is null or dkd_target_user_id is null then raise exception 'dkd_auth_required'; end if;
  if dkd_target_user_id<>dkd_auth_user_id and not dkd_is_admin_value then raise exception 'dkd_admin_required'; end if;

  with dkd_periods as (
    select 'daily'::text as dkd_key_value, dkd_day_start as dkd_start_at, now() as dkd_end_at
    union all select 'weekly',dkd_week_start,now()
    union all select 'monthly',dkd_month_start,now()
  ), dkd_stats as (
    select
      dkd_period_value.dkd_key_value,
      coalesce((
        select sum(coalesce(dkd_job_value.fee_tl,0))
        from public.dkd_courier_jobs dkd_job_value
        where dkd_job_value.assigned_user_id=dkd_target_user_id
          and coalesce(dkd_job_value.completed_at,dkd_job_value.updated_at)>=dkd_period_value.dkd_start_at
          and coalesce(dkd_job_value.completed_at,dkd_job_value.updated_at)<=dkd_period_value.dkd_end_at
          and (dkd_job_value.completed_at is not null or lower(coalesce(dkd_job_value.status,'')) in ('completed','delivered'))
      ),0)::numeric as dkd_earnings_tl,
      coalesce((
        select count(*)
        from public.dkd_courier_jobs dkd_job_value
        where dkd_job_value.assigned_user_id=dkd_target_user_id
          and coalesce(dkd_job_value.completed_at,dkd_job_value.updated_at)>=dkd_period_value.dkd_start_at
          and coalesce(dkd_job_value.completed_at,dkd_job_value.updated_at)<=dkd_period_value.dkd_end_at
          and (dkd_job_value.completed_at is not null or lower(coalesce(dkd_job_value.status,'')) in ('completed','delivered'))
      ),0)::bigint as dkd_completed_jobs,
      coalesce((
        select sum(greatest(0,extract(epoch from (least(coalesce(dkd_session_value.dkd_ended_at,now()),dkd_period_value.dkd_end_at)-greatest(dkd_session_value.dkd_started_at,dkd_period_value.dkd_start_at)))))
        from public.dkd_courier_online_sessions dkd_session_value
        where dkd_session_value.dkd_user_id=dkd_target_user_id
          and dkd_session_value.dkd_started_at<dkd_period_value.dkd_end_at
          and coalesce(dkd_session_value.dkd_ended_at,now())>dkd_period_value.dkd_start_at
      ),0)::numeric as dkd_online_seconds,
      coalesce((
        select sum(greatest(0,extract(epoch from (
          least(coalesce(dkd_job_value.completed_at,dkd_job_value.updated_at),dkd_period_value.dkd_end_at)
          - greatest(coalesce(dkd_job_value.accepted_at,dkd_job_value.picked_up_at,dkd_job_value.created_at),dkd_period_value.dkd_start_at)
        ))))
        from public.dkd_courier_jobs dkd_job_value
        where dkd_job_value.assigned_user_id=dkd_target_user_id
          and (dkd_job_value.completed_at is not null or lower(coalesce(dkd_job_value.status,'')) in ('completed','delivered'))
          and coalesce(dkd_job_value.completed_at,dkd_job_value.updated_at)>dkd_period_value.dkd_start_at
          and coalesce(dkd_job_value.accepted_at,dkd_job_value.picked_up_at,dkd_job_value.created_at)<dkd_period_value.dkd_end_at
      ),0)::numeric as dkd_delivery_seconds
    from dkd_periods dkd_period_value
  ), dkd_enriched as (
    select *,
      case
        when dkd_online_seconds>=60 then dkd_online_seconds
        when dkd_delivery_seconds>=60 then dkd_delivery_seconds
        else 0
      end as dkd_hourly_basis_seconds
    from dkd_stats
  )
  select jsonb_object_agg(dkd_key_value,jsonb_build_object(
    'dkd_earnings_tl',round(dkd_earnings_tl,2),
    'dkd_completed_jobs',dkd_completed_jobs,
    'dkd_online_seconds',floor(dkd_online_seconds),
    'dkd_online_hours',round(dkd_online_seconds/3600.0,2),
    'dkd_delivery_seconds',floor(dkd_delivery_seconds),
    'dkd_hourly_basis_seconds',floor(dkd_hourly_basis_seconds),
    'dkd_hourly_tl',case when dkd_hourly_basis_seconds>=60 then round(dkd_earnings_tl/(dkd_hourly_basis_seconds/3600.0),2) else 0 end
  )) into dkd_result_value
  from dkd_enriched;

  return coalesce(dkd_result_value,'{}'::jsonb)||jsonb_build_object(
    'dkd_user_id',dkd_target_user_id,
    'dkd_generated_at',now(),
    'dkd_is_online',coalesce((select p.dkd_courier_online from public.dkd_profiles p where p.user_id=dkd_target_user_id),false),
    'dkd_lifetime_earnings_tl',coalesce((select round(sum(coalesce(j.fee_tl,0)),2) from public.dkd_courier_jobs j where j.assigned_user_id=dkd_target_user_id and (j.completed_at is not null or lower(coalesce(j.status,'')) in ('completed','delivered'))),0),
    'dkd_lifetime_completed_jobs',coalesce((select count(*) from public.dkd_courier_jobs j where j.assigned_user_id=dkd_target_user_id and (j.completed_at is not null or lower(coalesce(j.status,'')) in ('completed','delivered'))),0)
  );
end;
$function$;

grant execute on function public.dkd_courier_earnings_summary_dkd(uuid) to authenticated;
