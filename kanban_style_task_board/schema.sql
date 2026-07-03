-- ============================================================
-- Kanban Board — Database Schema
-- Run this in the Supabase SQL Editor to set up the database.
-- ============================================================


-- ============================================================
-- Tables
-- ============================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'To Do'
    check (status in ('To Do', 'In Progress', 'In Review', 'Done')),
  priority text not null default 'Normal'
    check (priority in ('Low', 'Normal', 'High')),
  position float not null default 0,
  due_date timestamptz,
  user_id uuid not null references auth.users(id),
  assignee_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  color text not null default '#6366f1',
  constraint unique_label_per_user unique (user_id, name)
);

create table task_labels (
  task_id uuid references tasks(id) on delete cascade,
  label_id uuid references labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  content text not null,
  created_at timestamptz not null default now()
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null check (action in ('created', 'moved', 'edited', 'commented')),
  meta jsonb,
  created_at timestamptz not null default now()
);


-- ============================================================
-- Grants
-- (Required for new Supabase projects created after May 2026
--  which no longer auto-expose tables to the Data API)
-- ============================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete
  on tasks, labels, task_labels, comments, activity_log
  to authenticated;


-- ============================================================
-- Row Level Security
-- ============================================================

alter table tasks enable row level security;
alter table labels enable row level security;
alter table task_labels enable row level security;
alter table comments enable row level security;
alter table activity_log enable row level security;

-- tasks
create policy "select own tasks" on tasks for select to authenticated
  using ( (select auth.uid()) = user_id );

create policy "insert own tasks" on tasks for insert to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "update own tasks" on tasks for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "delete own tasks" on tasks for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- labels
create policy "manage own labels" on labels for all to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

-- task_labels: ownership flows through the parent task
create policy "manage own task_labels" on task_labels for all to authenticated
  using (
    exists (
      select 1 from tasks
      where tasks.id = task_labels.task_id
      and tasks.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from tasks
      where tasks.id = task_labels.task_id
      and tasks.user_id = (select auth.uid())
    )
  );

-- comments: readable and insertable only on tasks you own
create policy "manage comments on own tasks" on comments for all to authenticated
  using (
    exists (
      select 1 from tasks
      where tasks.id = comments.task_id
      and tasks.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from tasks
      where tasks.id = comments.task_id
      and tasks.user_id = (select auth.uid())
    )
  );

-- activity_log: select only — written exclusively by trigger
create policy "select own activity" on activity_log for select to authenticated
  using (
    exists (
      select 1 from tasks
      where tasks.id = activity_log.task_id
      and tasks.user_id = (select auth.uid())
    )
  );


-- ============================================================
-- Activity Log Trigger
-- Automatically logs task creation, moves, and edits.
-- Runs as security definer so it can write to activity_log
-- even though the client's RLS on that table is select-only.
-- ============================================================

create or replace function log_task_activity()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into activity_log (task_id, user_id, action, meta)
    values (new.id, new.user_id, 'created', null);

  elsif (tg_op = 'UPDATE' and old.status <> new.status) then
    insert into activity_log (task_id, user_id, action, meta)
    values (
      new.id,
      new.user_id,
      'moved',
      jsonb_build_object('from', old.status, 'to', new.status)
    );

  elsif (tg_op = 'UPDATE') then
    insert into activity_log (task_id, user_id, action, meta)
    values (new.id, new.user_id, 'edited', null);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_task_activity
after insert or update on tasks
for each row execute function log_task_activity();
