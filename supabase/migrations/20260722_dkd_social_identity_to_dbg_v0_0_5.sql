-- DraBornGo v0.0.5
-- Forward-only migration matching the migration already applied to the live Supabase project.
-- Historical migration files remain unchanged so the applied migration chain is not corrupted.

do $dkd_migration$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dkd_profiles'
      and column_name = 'ally_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dkd_profiles'
      and column_name = 'dbg_id'
  ) then
    alter table public.dkd_profiles rename column ally_id to dbg_id;
  end if;
end;
$dkd_migration$;

do $dkd_migration$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'dkd_profiles_ally_id_key'
      and conrelid = 'public.dkd_profiles'::regclass
  ) and not exists (
    select 1 from pg_constraint
    where conname = 'dkd_profiles_dbg_id_key'
      and conrelid = 'public.dkd_profiles'::regclass
  ) then
    alter table public.dkd_profiles
      rename constraint dkd_profiles_ally_id_key to dkd_profiles_dbg_id_key;
  end if;

  if to_regclass('public.idx_dkd_profiles_ally_id') is not null
     and to_regclass('public.idx_dkd_profiles_dbg_id') is null then
    alter index public.idx_dkd_profiles_ally_id rename to idx_dkd_profiles_dbg_id;
  end if;
end;
$dkd_migration$;

do $dkd_migration$
begin
  if to_regprocedure('public.dkd_generate_ally_id()') is not null
     and to_regprocedure('public.dkd_generate_dbg_id()') is null then
    alter function public.dkd_generate_ally_id() rename to dkd_generate_dbg_id;
  end if;
end;
$dkd_migration$;

create or replace function public.dkd_generate_dbg_id()
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  dkd_var_candidate text;
  dkd_var_attempt integer := 0;
begin
  loop
    dkd_var_attempt := dkd_var_attempt + 1;
    dkd_var_candidate := lpad(((floor(random() * 900000) + 100000))::bigint::text, 6, '0');
    exit when not exists (
      select 1
      from public.dkd_profiles
      where public.dkd_profiles.dbg_id = dkd_var_candidate
    );
    if dkd_var_attempt > 50 then
      dkd_var_candidate := substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      exit;
    end if;
  end loop;
  return dkd_var_candidate;
end;
$function$;

create or replace function public.dkd_profiles_before_ins_upd()
returns trigger
language plpgsql
as $function$
begin
  if tg_op = 'INSERT' and new.dbg_id is null then
    new.dbg_id := public.dkd_generate_dbg_id();
  end if;
  if new.level < 1 then new.level := 1; end if;
  if new.courier_level < 1 then new.courier_level := 1; end if;
  return new;
end;
$function$;

create or replace function public.dkd_after_dm_message_push_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  dkd_target_user_id_value uuid;
  dkd_sender_name_value text;
begin
  select coalesce(nullif(trim(dkd_profile_row.nickname), ''), 'Bir arkadaşın')
    into dkd_sender_name_value
  from public.dkd_profiles dkd_profile_row
  where dkd_profile_row.user_id = new.sender_id
  limit 1;

  select
    case
      when dkd_friendship_row.user_low = new.sender_id then dkd_friendship_row.user_high
      else dkd_friendship_row.user_low
    end
  into dkd_target_user_id_value
  from public.dkd_dm_threads dkd_thread_row
  join public.dkd_friendships dkd_friendship_row
    on dkd_friendship_row.id = dkd_thread_row.friendship_id
  where dkd_thread_row.id = new.thread_id
  limit 1;

  if dkd_target_user_id_value is null then
    return new;
  end if;

  perform public.dkd_queue_push_event(
    concat('dkd_dm_message_', new.id, '_', dkd_target_user_id_value),
    'social_message',
    dkd_target_user_id_value,
    'Yeni sohbet mesajı',
    concat(dkd_sender_name_value, ': ', left(coalesce(new.body, ''), 120)),
    'dbg',
    'dbg',
    jsonb_build_object(
      'threadId', new.thread_id,
      'messageId', new.id,
      'senderUserId', new.sender_id,
      'dkd_notification_kind', 'social_message'
    )
  );

  return new;
end;
$function$;

create or replace function public.dkd_after_friend_request_push_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  dkd_sender_name_value text;
begin
  if coalesce(new.status, 'pending') <> 'pending' then
    return new;
  end if;

  select coalesce(nullif(trim(dkd_profile_row.nickname), ''), 'Bir oyuncu')
    into dkd_sender_name_value
  from public.dkd_profiles dkd_profile_row
  where dkd_profile_row.user_id = new.requester_id
  limit 1;

  perform public.dkd_queue_push_event(
    concat('dkd_friend_request_', new.id, '_', new.addressee_id),
    'friend_request',
    new.addressee_id,
    'Yeni arkadaşlık isteği',
    concat(dkd_sender_name_value, ' sana arkadaşlık isteği gönderdi.'),
    'dbg',
    'dbg',
    jsonb_build_object(
      'friendRequestId', new.id,
      'requesterUserId', new.requester_id,
      'dkd_notification_kind', 'friend_request'
    )
  );

  return new;
end;
$function$;

create or replace function public.dkd_social_snapshot()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  dkd_current_user_id uuid := auth.uid();
  dkd_payload_value jsonb;
begin
  if dkd_current_user_id is null then
    return jsonb_build_object(
      'myProfile', null,
      'friends', '[]'::jsonb,
      'incoming', '[]'::jsonb,
      'outgoing', '[]'::jsonb
    );
  end if;

  insert into public.dkd_profiles (user_id)
  values (dkd_current_user_id)
  on conflict (user_id) do nothing;

  update public.dkd_profiles
  set social_last_seen_at = now(),
      social_status = 'online'
  where user_id = dkd_current_user_id;

  with dkd_my_profile_rows as (
    select
      dkd_profile_row.user_id,
      dkd_profile_row.dbg_id,
      coalesce(nullif(trim(dkd_profile_row.nickname), ''), 'Oyuncu') as nickname,
      coalesce(nullif(trim(dkd_profile_row.avatar_emoji), ''), '🦅') as avatar_emoji,
      coalesce(dkd_profile_row.level, 1) as level,
      coalesce(dkd_profile_row.rank_key, 'rookie') as rank_key,
      dkd_profile_row.social_status,
      dkd_profile_row.social_last_seen_at
    from public.dkd_profiles dkd_profile_row
    where dkd_profile_row.user_id = dkd_current_user_id
    limit 1
  ),
  dkd_friend_rows as (
    select
      dkd_friendship_row.id as friendship_id,
      dkd_other_profile_row.user_id,
      dkd_other_profile_row.dbg_id,
      coalesce(nullif(trim(dkd_other_profile_row.nickname), ''), 'Oyuncu') as nickname,
      coalesce(nullif(trim(dkd_other_profile_row.avatar_emoji), ''), '🦅') as avatar_emoji,
      coalesce(dkd_other_profile_row.level, 1) as level,
      coalesce(dkd_other_profile_row.rank_key, 'rookie') as rank_key,
      dkd_other_profile_row.social_status,
      dkd_other_profile_row.social_last_seen_at,
      dkd_thread_row.id as thread_id,
      dkd_thread_row.last_message_text,
      dkd_thread_row.last_message_at,
      dkd_friendship_row.created_at as friend_since,
      coalesce((
        select count(*)::integer
        from public.dkd_dm_messages dkd_message_row
        where dkd_message_row.thread_id = dkd_thread_row.id
          and dkd_message_row.sender_id <> dkd_current_user_id
          and dkd_message_row.seen_at is null
      ), 0) as unread_count
    from public.dkd_friendships dkd_friendship_row
    join public.dkd_profiles dkd_other_profile_row
      on dkd_other_profile_row.user_id = case when dkd_friendship_row.user_low = dkd_current_user_id then dkd_friendship_row.user_high else dkd_friendship_row.user_low end
    left join public.dkd_dm_threads dkd_thread_row on dkd_thread_row.friendship_id = dkd_friendship_row.id
    where (dkd_friendship_row.user_low = dkd_current_user_id or dkd_friendship_row.user_high = dkd_current_user_id)
      and public.dkd_social_is_blocked(dkd_current_user_id, dkd_other_profile_row.user_id) is false
    order by coalesce(dkd_thread_row.last_message_at, dkd_friendship_row.created_at) desc, dkd_other_profile_row.nickname asc
  ),
  dkd_incoming_rows as (
    select
      dkd_request_row.id as request_id,
      dkd_sender_profile_row.user_id,
      dkd_sender_profile_row.dbg_id,
      coalesce(nullif(trim(dkd_sender_profile_row.nickname), ''), 'Oyuncu') as nickname,
      coalesce(nullif(trim(dkd_sender_profile_row.avatar_emoji), ''), '🦅') as avatar_emoji,
      coalesce(dkd_sender_profile_row.level, 1) as level,
      coalesce(dkd_sender_profile_row.rank_key, 'rookie') as rank_key,
      dkd_sender_profile_row.social_status,
      dkd_sender_profile_row.social_last_seen_at,
      dkd_request_row.created_at
    from public.dkd_friend_requests dkd_request_row
    join public.dkd_profiles dkd_sender_profile_row on dkd_sender_profile_row.user_id = dkd_request_row.requester_id
    where dkd_request_row.addressee_id = dkd_current_user_id
      and dkd_request_row.status = 'pending'
      and public.dkd_social_is_blocked(dkd_current_user_id, dkd_sender_profile_row.user_id) is false
    order by dkd_request_row.created_at desc
  ),
  dkd_outgoing_rows as (
    select
      dkd_request_row.id as request_id,
      dkd_receiver_profile_row.user_id,
      dkd_receiver_profile_row.dbg_id,
      coalesce(nullif(trim(dkd_receiver_profile_row.nickname), ''), 'Oyuncu') as nickname,
      coalesce(nullif(trim(dkd_receiver_profile_row.avatar_emoji), ''), '🦅') as avatar_emoji,
      coalesce(dkd_receiver_profile_row.level, 1) as level,
      coalesce(dkd_receiver_profile_row.rank_key, 'rookie') as rank_key,
      dkd_receiver_profile_row.social_status,
      dkd_receiver_profile_row.social_last_seen_at,
      dkd_request_row.created_at
    from public.dkd_friend_requests dkd_request_row
    join public.dkd_profiles dkd_receiver_profile_row on dkd_receiver_profile_row.user_id = dkd_request_row.addressee_id
    where dkd_request_row.requester_id = dkd_current_user_id
      and dkd_request_row.status = 'pending'
      and public.dkd_social_is_blocked(dkd_current_user_id, dkd_receiver_profile_row.user_id) is false
    order by dkd_request_row.created_at desc
  )
  select jsonb_build_object(
    'myProfile', coalesce((select to_jsonb(dkd_my_profile_rows) from dkd_my_profile_rows), 'null'::jsonb),
    'friends', coalesce((select jsonb_agg(to_jsonb(dkd_friend_rows)) from dkd_friend_rows), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(to_jsonb(dkd_incoming_rows)) from dkd_incoming_rows), '[]'::jsonb),
    'outgoing', coalesce((select jsonb_agg(to_jsonb(dkd_outgoing_rows)) from dkd_outgoing_rows), '[]'::jsonb)
  ) into dkd_payload_value;

  return coalesce(dkd_payload_value, jsonb_build_object(
    'myProfile', null,
    'friends', '[]'::jsonb,
    'incoming', '[]'::jsonb,
    'outgoing', '[]'::jsonb
  ));
end;
$function$;

create or replace function public.dkd_social_touch_presence()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  dkd_var_user_id uuid := auth.uid();
  dkd_var_dbg_id text;
begin
  if dkd_var_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'auth_required');
  end if;

  insert into public.dkd_profiles (user_id, dbg_id, social_last_seen_at)
  values (dkd_var_user_id, public.dkd_generate_dbg_id(), now())
  on conflict (user_id) do update
  set social_last_seen_at = now(),
      dbg_id = coalesce(public.dkd_profiles.dbg_id, excluded.dbg_id),
      updated_at = now();

  select public.dkd_profiles.dbg_id into dkd_var_dbg_id
  from public.dkd_profiles
  where public.dkd_profiles.user_id = dkd_var_user_id;

  return jsonb_build_object('ok', true, 'dbg_id', dkd_var_dbg_id, 'user_id', dkd_var_user_id);
end;
$function$;

drop function if exists public.dkd_social_search_profiles(text, integer);

create function public.dkd_social_search_profiles(dkd_param_query text, dkd_param_limit integer default 12)
returns table(user_id uuid, dbg_id text, nickname text, avatar_emoji text, level integer, rank_key text, social_status text, social_last_seen_at timestamp with time zone, is_friend boolean, pending_sent boolean, pending_received boolean, request_id bigint)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with dkd_current_user_query as (
    select
      auth.uid() as dkd_current_user_id,
      regexp_replace(coalesce(trim(dkd_param_query), ''), '[^0-9]', '', 'g') as dkd_digits_text,
      lower(coalesce(trim(dkd_param_query), '')) as dkd_query_text
  )
  select
    dkd_profile_row.user_id,
    nullif(trim(coalesce(dkd_profile_row.dbg_id::text, '')), '') as dbg_id,
    coalesce(nullif(trim(dkd_profile_row.nickname), ''), 'Oyuncu') as nickname,
    coalesce(nullif(trim(dkd_profile_row.avatar_emoji), ''), '🦅') as avatar_emoji,
    coalesce(dkd_profile_row.level, 1) as level,
    coalesce(dkd_profile_row.rank_key, 'rookie') as rank_key,
    case
      when coalesce(dkd_profile_row.social_last_seen_at, now() - interval '365 days') >= now() - interval '3 minutes'
        then 'online'
      else 'away'
    end as social_status,
    dkd_profile_row.social_last_seen_at,
    exists (
      select 1
      from public.dkd_friendships dkd_friendship_row
      where (dkd_friendship_row.user_low = dkd_profile_row.user_id and dkd_friendship_row.user_high = (select dkd_current_user_id from dkd_current_user_query))
         or (dkd_friendship_row.user_high = dkd_profile_row.user_id and dkd_friendship_row.user_low = (select dkd_current_user_id from dkd_current_user_query))
    ) as is_friend,
    exists (
      select 1
      from public.dkd_friend_requests dkd_request_row
      where dkd_request_row.requester_id = (select dkd_current_user_id from dkd_current_user_query)
        and dkd_request_row.addressee_id = dkd_profile_row.user_id
        and dkd_request_row.status = 'pending'
    ) as pending_sent,
    exists (
      select 1
      from public.dkd_friend_requests dkd_request_row
      where dkd_request_row.requester_id = dkd_profile_row.user_id
        and dkd_request_row.addressee_id = (select dkd_current_user_id from dkd_current_user_query)
        and dkd_request_row.status = 'pending'
    ) as pending_received,
    (
      select dkd_request_row.id
      from public.dkd_friend_requests dkd_request_row
      where dkd_request_row.requester_id = dkd_profile_row.user_id
        and dkd_request_row.addressee_id = (select dkd_current_user_id from dkd_current_user_query)
        and dkd_request_row.status = 'pending'
      order by dkd_request_row.created_at desc
      limit 1
    ) as request_id
  from public.dkd_profiles dkd_profile_row
  cross join dkd_current_user_query
  where dkd_current_user_query.dkd_current_user_id is not null
    and dkd_profile_row.user_id <> dkd_current_user_query.dkd_current_user_id
    and coalesce(trim(dkd_param_query), '') <> ''
    and public.dkd_social_is_blocked(dkd_current_user_query.dkd_current_user_id, dkd_profile_row.user_id) is false
    and (
      (dkd_current_user_query.dkd_digits_text <> '' and dkd_profile_row.dbg_id::text = dkd_current_user_query.dkd_digits_text)
      or lower(coalesce(dkd_profile_row.nickname, '')) like ('%' || dkd_current_user_query.dkd_query_text || '%')
    )
  order by
    case when dkd_current_user_query.dkd_digits_text <> '' and dkd_profile_row.dbg_id::text = dkd_current_user_query.dkd_digits_text then 0 else 1 end,
    case when lower(coalesce(dkd_profile_row.nickname, '')) = dkd_current_user_query.dkd_query_text then 0 else 1 end,
    dkd_profile_row.level desc,
    dkd_profile_row.updated_at desc
  limit greatest(1, least(coalesce(dkd_param_limit, 12), 20));
$function$;

drop function if exists public.dkd_social_admin_moderation_queue(text, integer);

create function public.dkd_social_admin_moderation_queue(dkd_param_status_key text default 'dkd_open'::text, dkd_param_limit integer default 80)
returns table(dkd_id bigint, dkd_status_key text, dkd_reason_key text, dkd_detail_text text, dkd_thread_id uuid, dkd_message_id bigint, dkd_reporter_user_id uuid, dkd_reporter_dbg_id text, dkd_reporter_nickname text, dkd_reported_user_id uuid, dkd_reported_dbg_id text, dkd_reported_nickname text, dkd_admin_note_text text, dkd_created_at timestamp with time zone, dkd_updated_at timestamp with time zone, dkd_resolved_at timestamp with time zone)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  dkd_clean_status_key text := coalesce(nullif(trim(dkd_param_status_key), ''), 'dkd_open');
begin
  if coalesce(public.dkd_is_admin(), false) is not true then
    raise exception 'admin_required';
  end if;

  return query
  select
    dkd_report_row.dkd_id,
    dkd_report_row.dkd_status_key,
    dkd_report_row.dkd_reason_key,
    dkd_report_row.dkd_detail_text,
    dkd_report_row.dkd_thread_id,
    dkd_report_row.dkd_message_id,
    dkd_report_row.dkd_reporter_user_id,
    nullif(trim(coalesce(dkd_reporter_profile_row.dbg_id::text, '')), '') as dkd_reporter_dbg_id,
    coalesce(nullif(trim(dkd_reporter_profile_row.nickname), ''), 'Oyuncu') as dkd_reporter_nickname,
    dkd_report_row.dkd_reported_user_id,
    nullif(trim(coalesce(dkd_reported_profile_row.dbg_id::text, '')), '') as dkd_reported_dbg_id,
    coalesce(nullif(trim(dkd_reported_profile_row.nickname), ''), 'Oyuncu') as dkd_reported_nickname,
    dkd_report_row.dkd_admin_note_text,
    dkd_report_row.dkd_created_at,
    dkd_report_row.dkd_updated_at,
    dkd_report_row.dkd_resolved_at
  from public.dkd_social_reports dkd_report_row
  left join public.dkd_profiles dkd_reporter_profile_row on dkd_reporter_profile_row.user_id = dkd_report_row.dkd_reporter_user_id
  left join public.dkd_profiles dkd_reported_profile_row on dkd_reported_profile_row.user_id = dkd_report_row.dkd_reported_user_id
  where dkd_clean_status_key = 'dkd_all'
     or dkd_report_row.dkd_status_key = dkd_clean_status_key
  order by dkd_report_row.dkd_created_at desc
  limit greatest(1, least(coalesce(dkd_param_limit, 80), 200));
end;
$function$;

revoke all on function public.dkd_social_search_profiles(text, integer) from public;
grant execute on function public.dkd_social_search_profiles(text, integer) to authenticated, service_role;

revoke all on function public.dkd_social_admin_moderation_queue(text, integer) from public;
grant execute on function public.dkd_social_admin_moderation_queue(text, integer) to authenticated, service_role;

grant execute on function public.dkd_generate_dbg_id() to authenticated, service_role;
grant execute on function public.dkd_social_snapshot() to authenticated, service_role;
grant execute on function public.dkd_social_touch_presence() to authenticated, service_role;

comment on column public.dkd_profiles.dbg_id is 'DraBornGo six-character social identity. Renamed from the legacy social ID without changing profile or avatar data.';
