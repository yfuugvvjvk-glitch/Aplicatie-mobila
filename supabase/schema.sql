create table if not exists public.categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null check (char_length(name) between 2 and 80),
  color text not null,
  icon text not null,
  primary key (user_id, id)
);

create table if not exists public.tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  title text not null check (char_length(title) between 2 and 100),
  description text not null default '' check (char_length(description) <= 500),
  priority text not null check (priority in ('low', 'medium', 'high')),
  category_id text,
  due_date timestamptz,
  has_reminder boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, id)
);

alter table public.tasks
  drop constraint if exists tasks_user_category_fkey;

alter table public.tasks
  drop constraint if exists tasks_user_id_category_id_fkey;

alter table public.tasks
  add constraint tasks_user_category_fkey
  foreign key (user_id, category_id)
  references public.categories(user_id, id);

create index if not exists tasks_user_due_date_idx
  on public.tasks (user_id, due_date)
  where completed = false;

alter table public.categories enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "Users manage their own categories" on public.categories;
create policy "Users manage their own categories"
  on public.categories
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks"
  on public.tasks
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.categories, public.tasks from anon;
grant select, insert, update, delete on public.categories, public.tasks to authenticated;
