create or replace function public.message_contacts()
returns table (user_id uuid, name text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct p.id, p.name, p.role
  from public.profiles p
  where p.id <> (select auth.uid())
    and exists (
      select 1
      from public.messages m
      where (m.sender_id = (select auth.uid()) and m.recipient_id = p.id)
        or (m.recipient_id = (select auth.uid()) and m.sender_id = p.id)
    );
$$;

revoke all on function public.message_contacts() from public;
grant execute on function public.message_contacts() to authenticated;

notify pgrst, 'reload schema';
