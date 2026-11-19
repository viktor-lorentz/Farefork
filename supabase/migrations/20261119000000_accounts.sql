create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('route', 'restaurant')),
  key text not null check (char_length(key) between 1 and 200),
  title text not null check (char_length(title) between 1 and 200),
  subtitle text check (char_length(subtitle) <= 300),
  payload jsonb not null default '{}'::jsonb check (pg_column_size(payload) < 4096),
  created_at timestamptz not null default now(),
  unique (user_id, kind, key)
);

create index favorites_user_created on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

create policy "Read own favorites" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Add own favorites" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Remove own favorites" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.handoffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('ride', 'food')),
  provider_id text not null check (char_length(provider_id) between 1 and 40),
  title text not null check (char_length(title) between 1 and 200),
  subtitle text check (char_length(subtitle) <= 300),
  price_cents integer not null check (price_cents >= 0),
  standard_price_cents integer not null check (standard_price_cents >= 0),
  baseline_cents integer check (baseline_cents >= 0),
  saved_cents integer not null default 0 check (saved_cents >= 0),
  membership_saved_cents integer not null default 0 check (membership_saved_cents >= 0),
  simulated boolean not null default true,
  created_at timestamptz not null default now()
);

create index handoffs_user_created on public.handoffs (user_id, created_at desc);

alter table public.handoffs enable row level security;

create policy "Read own history" on public.handoffs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Add own history" on public.handoffs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Remove own history" on public.handoffs
  for delete to authenticated using (user_id = (select auth.uid()));

create view public.savings_summary
with (security_invoker = true) as
select
  user_id,
  count(*)::integer as handoff_count,
  coalesce(sum(saved_cents), 0)::integer as saved_cents,
  coalesce(sum(membership_saved_cents), 0)::integer as membership_saved_cents,
  coalesce(sum(saved_cents) filter (where created_at >= date_trunc('month', now())), 0)::integer
    as saved_this_month_cents,
  coalesce(
    sum(membership_saved_cents) filter (where created_at >= date_trunc('month', now())),
    0
  )::integer as membership_saved_this_month_cents
from public.handoffs
group by user_id;

grant select on public.savings_summary to authenticated;

create function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
