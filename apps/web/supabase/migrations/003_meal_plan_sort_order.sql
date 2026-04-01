-- Måltidsplan: numerisk rekkefølge per dag (Måltid 1, 2, …) i stedet for fast måltidstype.

alter table public.meal_plan_entries drop constraint if exists meal_plan_entries_unique_meal;
alter table public.meal_plan_entries drop constraint if exists meal_plan_entries_slot_check;

alter table public.meal_plan_entries add column if not exists sort_order integer;

update public.meal_plan_entries e
set sort_order = sub.rn
from (
  select
    id,
    (row_number() over (
      partition by user_id, plan_date
      order by created_at asc, id asc
    ) - 1)::integer as rn
  from public.meal_plan_entries
) sub
where e.id = sub.id;

alter table public.meal_plan_entries alter column sort_order set not null;

alter table public.meal_plan_entries drop column if exists meal_slot;

create unique index if not exists meal_plan_entries_user_date_order_uq
  on public.meal_plan_entries (user_id, plan_date, sort_order);
