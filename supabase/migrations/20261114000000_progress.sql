-- Progress sync for Four Weeks to TypeScript.
-- One row per signed-in person, holding their progress as JSON.
-- Row level security makes sure each person can only see and change their own row.

create table public.progress (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  -- keep rows a sensible size (exercise code included)
  constraint progress_data_size check (pg_column_size(data) < 1000000)
);

alter table public.progress enable row level security;

create policy "Read own progress"
  on public.progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Create own progress"
  on public.progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Update own progress"
  on public.progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Delete own progress"
  on public.progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);
