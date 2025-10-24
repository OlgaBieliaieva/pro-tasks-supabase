import "dotenv/config";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

async function initDB() {
  const schemaSQL = `
  -- ==============================
  -- TABLES
  -- ==============================
  create table if not exists profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    avatar_url text,
    created_at timestamp with time zone default now()
  );

  create table if not exists projects (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    owner_id uuid references profiles(id) on delete cascade,
    created_at timestamp with time zone default now()
  );

  create table if not exists tasks (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    status text default 'todo' check (status in ('todo','in_progress','done')),
    project_id uuid references projects(id) on delete cascade,
    assigned_to uuid references profiles(id),
    created_at timestamp with time zone default now()
  );

  create table if not exists comments (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references tasks(id) on delete cascade,
    author_id uuid references profiles(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default now()
  );

  create table if not exists project_members (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references projects(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    role text default 'member'
  );

  -- ==============================
  -- TRIGGER: create profile on new user
  -- ==============================
  create or replace function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.profiles (id, name, avatar_url)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'name', new.email),
      new.raw_user_meta_data->>'avatar_url'
    );
    return new;
  end;
  $$ language plpgsql security definer;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

  -- ==============================
  -- RLS policies
  -- ==============================
  alter table profiles enable row level security;
  alter table projects enable row level security;
  alter table tasks enable row level security;
  alter table comments enable row level security;
  alter table project_members enable row level security;

  -- Уникнення дублювання політик (якщо вже існують)
  drop policy if exists "Users can view their own profile" on profiles;
  create policy "Users can view their own profile"
  on profiles
  for select
  using (auth.uid() = id);

  drop policy if exists "Users can view owned or member projects" on projects;
  create policy "Users can view owned or member projects"
  on projects
  for select
  using (
    owner_id = auth.uid()
    or id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

  drop policy if exists "Users can view tasks from their projects" on tasks;
  create policy "Users can view tasks from their projects"
  on tasks
  for select
  using (
    project_id in (
      select id from projects
      where owner_id = auth.uid()
         or id in (select project_id from project_members where user_id = auth.uid())
    )
  );

  drop policy if exists "Users can view project memberships" on project_members;
  create policy "Users can view project memberships"
  on project_members
  for select
  using (
    user_id = auth.uid()
    or project_id in (select id from projects where owner_id = auth.uid())
  );

  -- Full access for service role
  drop policy if exists "Service role has full access" on profiles;
  create policy "Service role has full access"
  on profiles
  for all
  to service_role
  using (true)
  with check (true);

  drop policy if exists "Service role has full access" on projects;
  create policy "Service role has full access"
  on projects
  for all
  to service_role
  using (true)
  with check (true);

  drop policy if exists "Service role has full access" on tasks;
  create policy "Service role has full access"
  on tasks
  for all
  to service_role
  using (true)
  with check (true);

  drop policy if exists "Service role has full access" on comments;
  create policy "Service role has full access"
  on comments
  for all
  to service_role
  using (true)
  with check (true);

  drop policy if exists "Service role has full access" on project_members;
  create policy "Service role has full access"
  on project_members
  for all
  to service_role
  using (true)
  with check (true);
  `;

  console.log("🚀 Running schema initialization...");
  const { error } = await supabaseAdmin.rpc("exec_sql", {
    sql_text: schemaSQL,
  });

  if (error) {
    console.error("❌ Schema init error:", error);
  } else {
    console.log("✅ Database initialized and migrated successfully!");
  }
}

initDB();
