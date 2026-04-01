-- Recipe favorites (Sanity oppskrift _id) and meal plan entries.

create table if not exists public.recipe_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_sanity_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_sanity_id)
);

create index if not exists recipe_favorites_user_created_idx
  on public.recipe_favorites (user_id, created_at desc);

alter table public.recipe_favorites enable row level security;

drop policy if exists "recipe_favorites_select_own" on public.recipe_favorites;
create policy "recipe_favorites_select_own"
on public.recipe_favorites for select
using (auth.uid() = user_id);

drop policy if exists "recipe_favorites_insert_own" on public.recipe_favorites;
create policy "recipe_favorites_insert_own"
on public.recipe_favorites for insert
with check (auth.uid() = user_id);

drop policy if exists "recipe_favorites_delete_own" on public.recipe_favorites;
create policy "recipe_favorites_delete_own"
on public.recipe_favorites for delete
using (auth.uid() = user_id);

create table if not exists public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  meal_slot text not null default 'middag',
  recipe_sanity_id text not null,
  created_at timestamptz not null default now(),
  constraint meal_plan_entries_slot_check check (
    meal_slot in ('frokost', 'lunsj', 'middag', 'kveld', 'snack')
  ),
  constraint meal_plan_entries_unique_meal unique (user_id, plan_date, meal_slot, recipe_sanity_id)
);

create index if not exists meal_plan_entries_user_date_idx
  on public.meal_plan_entries (user_id, plan_date);

alter table public.meal_plan_entries enable row level security;

drop policy if exists "meal_plan_entries_select_own" on public.meal_plan_entries;
create policy "meal_plan_entries_select_own"
on public.meal_plan_entries for select
using (auth.uid() = user_id);

drop policy if exists "meal_plan_entries_insert_own" on public.meal_plan_entries;
create policy "meal_plan_entries_insert_own"
on public.meal_plan_entries for insert
with check (auth.uid() = user_id);

drop policy if exists "meal_plan_entries_update_own" on public.meal_plan_entries;
create policy "meal_plan_entries_update_own"
on public.meal_plan_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "meal_plan_entries_delete_own" on public.meal_plan_entries;
create policy "meal_plan_entries_delete_own"
on public.meal_plan_entries for delete
using (auth.uid() = user_id);
