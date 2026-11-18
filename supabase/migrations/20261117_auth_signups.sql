alter table public.seller_applications
  add column if not exists business_name text not null default '',
  add column if not exists categories text[] not null default '{}',
  add column if not exists bio text not null default '',
  add column if not exists state text not null default '',
  add column if not exists city text not null default '',
  add column if not exists what_sells text not null default '',
  add column if not exists social text not null default '';

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
  end if;
  return new;
end;
$$;
