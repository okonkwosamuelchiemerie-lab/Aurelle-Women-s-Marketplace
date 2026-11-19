insert into public.profiles (id, name, phone, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', ''),
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  case when u.raw_user_meta_data ->> 'role' = 'seller' then 'seller' else 'buyer' end
from auth.users u
on conflict (id) do nothing;

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  name text,
  phone text,
  role text,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.name, p.phone, p.role, p.status, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.role <> 'admin'
    order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

notify pgrst, 'reload schema';
