import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'


async function initDB() {
  const schemaSQL = `
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
  `

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_text: schemaSQL })
  if (error) {
    console.error('❌ Schema init error:', error)
  } else {
    console.log('✅ Database initialized successfully!')
  }
}

initDB()