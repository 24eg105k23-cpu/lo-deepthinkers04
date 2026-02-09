-- Workspaces Table
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Workspaces
alter table public.workspaces enable row level security;

create policy "Users can view their own workspaces"
on public.workspaces for select
using (auth.uid() = user_id);

create policy "Users can insert their own workspaces"
on public.workspaces for insert
with check (auth.uid() = user_id);

create policy "Users can update their own workspaces"
on public.workspaces for update
using (auth.uid() = user_id);

create policy "Users can delete their own workspaces"
on public.workspaces for delete
using (auth.uid() = user_id);
