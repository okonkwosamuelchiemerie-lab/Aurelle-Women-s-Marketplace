create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  application jsonb := metadata -> 'seller_application';
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(metadata ->> 'name', ''),
    coalesce(metadata ->> 'phone', ''),
    case when metadata ->> 'role' = 'seller' then 'seller' else 'buyer' end
  );
  if metadata ->> 'role' = 'seller' and application is not null then
    insert into public.seller_applications (
      owner_id, business_type, cac, years_in_business, business_address, sourcing,
      product_count, monthly_orders, delivery_methods, delivery_time, return_policy,
      business_name, categories, bio, state, city, what_sells, social
    )
    values (
      new.id,
      coalesce(application ->> 'business_type', ''),
      coalesce(application ->> 'cac', ''),
      coalesce(application ->> 'years_in_business', ''),
      coalesce(application ->> 'business_address', ''),
      coalesce(application ->> 'sourcing', ''),
      coalesce(application ->> 'product_count', ''),
      coalesce(application ->> 'monthly_orders', ''),
      coalesce(array(select pg_catalog.jsonb_array_elements_text(application -> 'delivery_methods')), '{}'::text[]),
      coalesce(application ->> 'delivery_time', ''),
      coalesce(application ->> 'return_policy', ''),
      coalesce(application ->> 'business_name', ''),
      coalesce(array(select pg_catalog.jsonb_array_elements_text(application -> 'categories')), '{}'::text[]),
      coalesce(application ->> 'bio', ''),
      coalesce(application ->> 'state', ''),
      coalesce(application ->> 'city', ''),
      coalesce(application ->> 'what_sells', ''),
      coalesce(application ->> 'social', '')
    );
    insert into public.shops (owner_id, name, state, city, categories, bio, what_sells, social)
    values (
      new.id,
      coalesce(application ->> 'business_name', ''),
      coalesce(application ->> 'state', ''),
      coalesce(application ->> 'city', ''),
      coalesce(array(select pg_catalog.jsonb_array_elements_text(application -> 'categories')), '{}'::text[]),
      coalesce(application ->> 'bio', ''),
      coalesce(application ->> 'what_sells', ''),
      coalesce(application ->> 'social', '')
    )
    on conflict (owner_id) do nothing;
  end if;
  return new;
end;
$$;

drop policy if exists "Active shops are public; owners and admins can read their shops" on public.shops;
create policy "Active shops are public; owners and admins can read their shops"
  on public.shops for select
  using (
    (verified = 'verified' and public.is_active_profile(shops.owner_id))
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists "Products in active shops are public" on public.products;
create policy "Products in active shops are public"
  on public.products for select
  using (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.verified = 'verified'
        and public.is_active_profile(shops.owner_id)
    )
    or exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = (select auth.uid())
        and shops.verified <> 'rejected'
    )
    or (select public.is_admin())
  );

drop policy if exists "Sellers create their own pending shop" on public.shops;
create policy "Sellers create their own pending shop"
  on public.shops for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and verified = 'pending'
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'seller'
        and profiles.status = 'active'
    )
    and exists (
      select 1 from public.seller_applications
      where seller_applications.owner_id = (select auth.uid())
        and seller_applications.status = 'pending'
    )
  );

drop policy if exists "Sellers update their own shop" on public.shops;
create policy "Sellers update their own shop"
  on public.shops for update to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'seller'
        and profiles.status = 'active'
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'seller'
        and profiles.status = 'active'
    )
  );

drop policy if exists "Sellers submit their own application" on public.seller_applications;
create policy "Sellers submit their own application"
  on public.seller_applications for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'seller'
        and profiles.status = 'active'
    )
  );

drop policy if exists "Sellers update their own application details" on public.seller_applications;
create policy "Sellers update their own application details"
  on public.seller_applications for update to authenticated
  using (
    owner_id = (select auth.uid())
    and status = 'pending'
    and public.is_active_profile(owner_id)
  )
  with check (
    owner_id = (select auth.uid())
    and status = 'pending'
    and public.is_active_profile(owner_id)
  );

drop policy if exists "Sellers update products in their own shop" on public.products;
create policy "Sellers update products in their own shop"
  on public.products for update to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = (select auth.uid())
        and shops.verified <> 'rejected'
        and public.is_active_profile(shops.owner_id)
        and exists (
          select 1 from public.profiles
          where profiles.id = (select auth.uid()) and profiles.role = 'seller'
        )
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = (select auth.uid())
        and shops.verified <> 'rejected'
        and public.is_active_profile(shops.owner_id)
        and exists (
          select 1 from public.profiles
          where profiles.id = (select auth.uid()) and profiles.role = 'seller'
        )
    )
  );

drop policy if exists "Sellers delete products in their own shop" on public.products;
create policy "Sellers delete products in their own shop"
  on public.products for delete to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = (select auth.uid())
        and public.is_active_profile(shops.owner_id)
        and exists (
          select 1 from public.profiles
          where profiles.id = (select auth.uid()) and profiles.role = 'seller'
        )
    )
  );

drop policy if exists "Shop owners update images in their own folder" on storage.objects;
create policy "Shop owners update images in their own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.shops
      join public.profiles on profiles.id = shops.owner_id
      where shops.id::text = (storage.foldername(objects.name))[1]
        and shops.owner_id = (select auth.uid())
        and shops.verified <> 'rejected'
        and profiles.status = 'active'
        and profiles.role = 'seller'
    )
  )
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.shops
      join public.profiles on profiles.id = shops.owner_id
      where shops.id::text = (storage.foldername(objects.name))[1]
        and shops.owner_id = (select auth.uid())
        and shops.verified <> 'rejected'
        and profiles.status = 'active'
        and profiles.role = 'seller'
    )
  );

drop policy if exists "Shop owners delete images in their own folder" on storage.objects;
create policy "Shop owners delete images in their own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.shops
      join public.profiles on profiles.id = shops.owner_id
      where shops.id::text = (storage.foldername(objects.name))[1]
        and shops.owner_id = (select auth.uid())
        and profiles.status = 'active'
        and profiles.role = 'seller'
    )
  );

drop policy if exists "Users can send messages as themselves" on public.messages;
create policy "Users can send messages as themselves"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles sender
      join public.profiles recipient on recipient.id = messages.recipient_id
      where sender.id = (select auth.uid())
        and sender.status = 'active'
        and recipient.status = 'active'
        and (
          (sender.role = 'buyer' and recipient.role = 'seller')
          or (sender.role = 'seller' and recipient.role = 'buyer')
        )
    )
  );

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
      select 1 from public.messages m
      where (m.sender_id = (select auth.uid()) and m.recipient_id = p.id)
        or (m.recipient_id = (select auth.uid()) and m.sender_id = p.id)
    );
$$;

revoke all on function public.message_contacts() from public;
grant execute on function public.message_contacts() to authenticated;

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

create or replace function public.admin_set_profile_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'Invalid profile status' using errcode = '22023';
  end if;
  update public.profiles
  set status = p_status
  where id = p_user_id and role <> 'admin';
  if not found then
    raise exception 'User not found or cannot be changed' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_profile_status(uuid, text) from public;
grant execute on function public.admin_set_profile_status(uuid, text) to authenticated;

create or replace function public.admin_set_shop_status(p_shop_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  shop_owner_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'verified', 'rejected') then
    raise exception 'Invalid shop status' using errcode = '22023';
  end if;
  update public.shops
  set verified = p_status
  where id = p_shop_id
  returning owner_id into shop_owner_id;
  if shop_owner_id is null then
    raise exception 'Shop not found' using errcode = 'P0002';
  end if;
  update public.seller_applications
  set status = case p_status
    when 'verified' then 'approved'
    when 'rejected' then 'rejected'
    else 'pending'
  end
  where owner_id = shop_owner_id;
end;
$$;

revoke all on function public.admin_set_shop_status(uuid, text) from public;
grant execute on function public.admin_set_shop_status(uuid, text) to authenticated;
