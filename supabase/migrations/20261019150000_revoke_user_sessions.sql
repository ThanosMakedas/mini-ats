-- Logs a user out everywhere by deleting their sessions (refresh tokens are removed with them).
-- Used by the set-password edge function so a new password also locks out existing sessions.
create function public.revoke_user_sessions(target_user uuid) returns void
language sql security definer set search_path = '' as $$
  delete from auth.sessions where user_id = target_user;
$$;

-- Only the service role (the edge functions) may call it.
revoke execute on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
