-- UPDATE + DELETE policies on resumego_sessions so the dashboard can
-- rename and delete a user's own resumes without going through n8n.
-- SELECT policy already exists from dashboard_read_rls.sql.

alter table public.resumego_sessions enable row level security;

drop policy if exists users_update_own_sessions on public.resumego_sessions;
create policy users_update_own_sessions
  on public.resumego_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists users_delete_own_sessions on public.resumego_sessions;
create policy users_delete_own_sessions
  on public.resumego_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);
