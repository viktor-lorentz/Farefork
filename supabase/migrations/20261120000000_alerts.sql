create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pickup jsonb not null,
  dropoff jsonb not null,
  title text not null check (char_length(title) between 1 and 200),
  target_cents integer not null check (target_cents between 100 and 100000),
  membership_ids text[] not null default '{}',
  active boolean not null default true,
  expires_at timestamptz not null default now() + interval '7 days',
  last_checked_at timestamptz,
  last_price_cents integer,
  last_provider_id text,
  triggered_at timestamptz,
  triggered_price_cents integer,
  triggered_provider_id text,
  created_at timestamptz not null default now(),
  constraint price_alerts_pickup_shape check (
    jsonb_typeof(pickup -> 'latitude') = 'number' and jsonb_typeof(pickup -> 'longitude') = 'number'
  ),
  constraint price_alerts_dropoff_shape check (
    jsonb_typeof(dropoff -> 'latitude') = 'number' and jsonb_typeof(dropoff -> 'longitude') = 'number'
  )
);

create index price_alerts_user_idx on public.price_alerts (user_id, created_at desc);
create index price_alerts_due_idx on public.price_alerts (active, last_checked_at);

alter table public.price_alerts enable row level security;

create policy "Users read their alerts" on public.price_alerts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create their alerts" on public.price_alerts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their alerts" on public.price_alerts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their alerts" on public.price_alerts
  for delete to authenticated using ((select auth.uid()) = user_id);

create function public.limit_price_alerts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.price_alerts where user_id = new.user_id) >= 20 then
    raise exception 'You can keep up to 20 price alerts.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger price_alerts_limit before insert on public.price_alerts
  for each row execute function public.limit_price_alerts();

create table public.push_tokens (
  token text primary key check (char_length(token) between 10 and 300),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "Users read their push tokens" on public.push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users delete their push tokens" on public.push_tokens
  for delete to authenticated using ((select auth.uid()) = user_id);

create function public.register_push_token(push_token text, device_platform text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (push_token, (select auth.uid()), device_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
