-- Initial Supabase schema for Aurelle. Run once in a new project.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  address text not null default '',
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create function public.is_active_profile(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id and status = 'active'
  );
$$;

revoke all on function public.is_active_profile(uuid) from public;
grant execute on function public.is_active_profile(uuid) to anon, authenticated;

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null,
  state text not null default '',
  city text not null default '',
  categories text[] not null default '{}',
  bio text not null default '',
  what_sells text not null default '',
  social text not null default '',
  logo_path text not null default '',
  cover_path text not null default '',
  verified text not null default 'pending'
    check (verified in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  business_type text not null,
  cac text not null default '',
  years_in_business text not null,
  business_address text not null,
  sourcing text not null,
  product_count text not null,
  monthly_orders text not null,
  delivery_methods text[] not null default '{}',
  delivery_time text not null,
  return_policy text not null,
  business_name text not null default '',
  categories text[] not null default '{}',
  bio text not null default '',
  state text not null default '',
  city text not null default '',
  what_sells text not null default '',
  social text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  category text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_shop_id_idx on public.products (shop_id);
create index products_category_idx on public.products (category);
create index seller_applications_status_idx on public.seller_applications (status);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id),
  shop_id uuid not null references public.shops (id),
  currency text not null default 'NGN' check (currency = 'NGN'),
  subtotal numeric(12, 2) not null check (subtotal > 0),
  commission_rate numeric(5, 4) not null check (commission_rate between 0 and 1),
  commission_amount numeric(12, 2) not null check (commission_amount >= 0),
  seller_amount numeric(12, 2) not null check (seller_amount >= 0),
  delivery_address text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'shipped', 'completed', 'refunded', 'cancelled')),
  created_at timestamptz not null default now(),
  shipped_at timestamptz,
  completed_at timestamptz,
  constraint orders_amounts_match check (commission_amount + seller_amount = subtotal)
);

create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_shop_id_idx on public.orders (shop_id);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price > 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  provider text not null check (provider in ('paystack', 'flutterwave')),
  provider_reference text unique,
  amount_minor bigint not null check (amount_minor > 0),
  status text not null default 'initialized'
    check (status in ('initialized', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  constraint messages_no_self_chat check (sender_id <> recipient_id)
);

create index messages_participants_idx
  on public.messages (sender_id, recipient_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.seller_applications enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;

grant select on public.shops, public.products to anon, authenticated;
grant select on public.profiles, public.seller_applications, public.orders,
  public.order_items, public.messages to authenticated;

grant update (name, phone, address) on public.profiles to authenticated;
grant insert (owner_id, name, state, city, categories, bio, what_sells, social, logo_path, cover_path)
  on public.shops to authenticated;
grant update (name, state, city, categories, bio, what_sells, social, logo_path, cover_path)
  on public.shops to authenticated;
grant insert (
  owner_id, business_type, cac, years_in_business, business_address, sourcing,
  product_count, monthly_orders, delivery_methods, delivery_time, return_policy
) on public.seller_applications to authenticated;
grant update (
  business_type, cac, years_in_business, business_address, sourcing,
  product_count, monthly_orders, delivery_methods, delivery_time, return_policy
) on public.seller_applications to authenticated;
grant insert (shop_id, name, category, description, price, stock, images)
  on public.products to authenticated;
grant update (name, category, description, price, stock, images)
  on public.products to authenticated;
grant delete on public.products to authenticated;
grant insert (sender_id, recipient_id, product_id, body) on public.messages to authenticated;
grant all on public.profiles, public.shops, public.seller_applications, public.products,
  public.orders, public.order_items, public.payments, public.messages to service_role;

create policy "Users read their own profile; admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Active shops are public; owners and admins can read their shops"
  on public.shops for select
  using (
    (
      verified = 'verified'
      and public.is_active_profile(shops.owner_id)
    )
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );

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

create policy "Applicants and admins read seller applications"
  on public.seller_applications for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));

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

create policy "Sellers manage products in their own active shop"
  on public.products for insert to authenticated
  with check (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = (select auth.uid())
        and shops.verified <> 'rejected'
        and exists (
          select 1 from public.profiles
          where profiles.id = (select auth.uid())
            and profiles.role = 'seller'
            and profiles.status = 'active'
        )
    )
  );

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

create policy "Order participants and admins can read orders"
  on public.orders for select to authenticated
  using (
    buyer_id = (select auth.uid())
    or exists (
      select 1 from public.shops
      where shops.id = orders.shop_id and shops.owner_id = (select auth.uid())
    )
    or (select public.is_admin())
  );

create policy "Order participants and admins can read order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders
      join public.shops on shops.id = orders.shop_id
      where orders.id = order_items.order_id
        and (
          orders.buyer_id = (select auth.uid())
          or shops.owner_id = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

create policy "Message participants and admins can read messages"
  on public.messages for select to authenticated
  using (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or (select public.is_admin())
  );

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Product images are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'product-images');

create policy "Shop owners upload images to their own folder"
  on storage.objects for insert to authenticated
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
