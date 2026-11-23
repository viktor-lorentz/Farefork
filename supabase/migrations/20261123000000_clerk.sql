drop view if exists public.savings_summary;

drop policy "Read own favorites" on public.favorites;
drop policy "Add own favorites" on public.favorites;
drop policy "Remove own favorites" on public.favorites;
drop policy "Read own history" on public.handoffs;
drop policy "Add own history" on public.handoffs;
drop policy "Remove own history" on public.handoffs;
drop policy "Users read their alerts" on public.price_alerts;
drop policy "Users create their alerts" on public.price_alerts;
drop policy "Users update their alerts" on public.price_alerts;
drop policy "Users delete their alerts" on public.price_alerts;
drop policy "Users read their push tokens" on public.push_tokens;
drop policy "Users delete their push tokens" on public.push_tokens;

truncate public.favorites, public.handoffs, public.price_alerts, public.push_tokens;

alter table public.favorites drop constraint if exists favorites_user_id_fkey;
alter table public.handoffs drop constraint if exists handoffs_user_id_fkey;
alter table public.price_alerts drop constraint if exists price_alerts_user_id_fkey;
alter table public.push_tokens drop constraint if exists push_tokens_user_id_fkey;

alter table public.favorites alter column user_id drop default;
alter table public.handoffs alter column user_id drop default;
alter table public.price_alerts alter column user_id drop default;

alter table public.favorites alter column user_id type text using user_id::text;
alter table public.handoffs alter column user_id type text using user_id::text;
alter table public.price_alerts alter column user_id type text using user_id::text;
alter table public.push_tokens alter column user_id type text using user_id::text;

alter table public.favorites alter column user_id set default (auth.jwt() ->> 'sub');
alter table public.handoffs alter column user_id set default (auth.jwt() ->> 'sub');
alter table public.price_alerts alter column user_id set default (auth.jwt() ->> 'sub');

create policy "Read own favorites" on public.favorites
  for select to authenticated using (user_id = (select auth.jwt() ->> 'sub'));
create policy "Add own favorites" on public.favorites
  for insert to authenticated with check (user_id = (select auth.jwt() ->> 'sub'));
create policy "Remove own favorites" on public.favorites
  for delete to authenticated using (user_id = (select auth.jwt() ->> 'sub'));

create policy "Read own history" on public.handoffs
  for select to authenticated using (user_id = (select auth.jwt() ->> 'sub'));
create policy "Add own history" on public.handoffs
  for insert to authenticated with check (user_id = (select auth.jwt() ->> 'sub'));
create policy "Remove own history" on public.handoffs
  for delete to authenticated using (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users read their alerts" on public.price_alerts
  for select to authenticated using ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users create their alerts" on public.price_alerts
  for insert to authenticated with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users update their alerts" on public.price_alerts
  for update to authenticated using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users delete their alerts" on public.price_alerts
  for delete to authenticated using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users read their push tokens" on public.push_tokens
  for select to authenticated using ((select auth.jwt() ->> 'sub') = user_id);
create policy "Users delete their push tokens" on public.push_tokens
  for delete to authenticated using ((select auth.jwt() ->> 'sub') = user_id);

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

create or replace function public.register_push_token(push_token text, device_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner text := (select auth.jwt() ->> 'sub');
begin
  if owner is null then
    raise exception 'Sign in to register for alerts.' using errcode = '42501';
  end if;
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (push_token, owner, device_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner text := (select auth.jwt() ->> 'sub');
begin
  if owner is null then
    raise exception 'Sign in to delete your account.' using errcode = '42501';
  end if;
  delete from public.favorites where user_id = owner;
  delete from public.handoffs where user_id = owner;
  delete from public.price_alerts where user_id = owner;
  delete from public.push_tokens where user_id = owner;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
