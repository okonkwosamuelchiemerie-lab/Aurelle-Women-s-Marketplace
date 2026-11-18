create or replace function public.create_paystack_checkout(
  p_buyer_id uuid,
  p_items jsonb,
  p_delivery_address text,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  product_row record;
  v_shop_id uuid;
  order_id uuid;
  order_total numeric(12, 2) := 0;
  completed_sales numeric(12, 2) := 0;
  commission_rate numeric(5, 4);
  commission_amount numeric(12, 2);
  seller_amount numeric(12, 2);
begin
  if p_buyer_id is null or p_reference is null or length(trim(p_reference)) < 8 then
    raise exception 'Invalid checkout request';
  end if;
  if coalesce(length(trim(p_delivery_address)), 0) < 8 then
    raise exception 'Enter a complete delivery address';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'Cart must contain between 1 and 30 products';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_buyer_id and role = 'buyer' and status = 'active'
  ) then
    raise exception 'An active buyer account is required';
  end if;

  for item in
    select product_id, sum(quantity)::integer as quantity
    from pg_catalog.jsonb_to_recordset(p_items) as cart_item(product_id uuid, quantity integer)
    group by product_id
    order by product_id
  loop
    if item.product_id is null or item.quantity is null or item.quantity < 1 or item.quantity > 99 then
      raise exception 'Invalid product quantity';
    end if;

    select p.id, p.shop_id, p.name, p.price, p.stock,
      s.verified, seller.status as seller_status
    into product_row
    from public.products p
    join public.shops s on s.id = p.shop_id
    join public.profiles seller on seller.id = s.owner_id
    where p.id = item.product_id
    for update of p;

    if not found or product_row.verified <> 'verified' or product_row.seller_status <> 'active' then
      raise exception 'A product is no longer available';
    end if;
    if product_row.stock < item.quantity then
      raise exception 'Not enough stock for %', product_row.name;
    end if;
    if v_shop_id is null then
      v_shop_id := product_row.shop_id;
    elsif v_shop_id <> product_row.shop_id then
      raise exception 'Checkout one shop at a time';
    end if;
    order_total := order_total + product_row.price * item.quantity;
  end loop;

  if order_total <= 0 then
    raise exception 'Order total must be greater than zero';
  end if;

  select coalesce(sum(subtotal), 0)
  into completed_sales
  from public.orders
  where public.orders.shop_id = v_shop_id
    and status = 'completed';
  commission_rate := case when completed_sales >= 300000 then 0.07 else 0.08 end;
  commission_amount := round(order_total * commission_rate, 2);
  seller_amount := order_total - commission_amount;

  insert into public.orders (
    buyer_id, shop_id, subtotal, commission_rate, commission_amount,
    seller_amount, delivery_address, status
  ) values (
    p_buyer_id, v_shop_id, order_total, commission_rate, commission_amount,
    seller_amount, trim(p_delivery_address), 'pending_payment'
  ) returning id into order_id;

  for item in
    select product_id, sum(quantity)::integer as quantity
    from pg_catalog.jsonb_to_recordset(p_items) as cart_item(product_id uuid, quantity integer)
    group by product_id
    order by product_id
  loop
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    select order_id, p.id, p.name, p.price, item.quantity
    from public.products p
    where p.id = item.product_id;

    update public.products p
    set stock = p.stock - item.quantity
    where p.id = item.product_id;
  end loop;

  insert into public.payments (order_id, provider, provider_reference, amount_minor)
  values (order_id, 'paystack', p_reference, round(order_total * 100)::bigint);

  return jsonb_build_object(
    'order_id', order_id,
    'reference', p_reference,
    'amount_minor', round(order_total * 100)::bigint,
    'currency', 'NGN'
  );
end;
$$;

create or replace function public.complete_paystack_checkout(
  p_reference text,
  p_amount_minor bigint,
  p_currency text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_row record;
begin
  select payments.id, payments.order_id, payments.amount_minor,
    payments.status as payment_status, orders.status as order_status
  into payment_row
  from public.payments
  join public.orders on orders.id = payments.order_id
  where payments.provider_reference = p_reference
    and payments.provider = 'paystack'
  for update of payments, orders;

  if not found then
    raise exception 'Payment reference not found';
  end if;
  if payment_row.payment_status = 'paid' then
    return payment_row.order_id;
  end if;
  if payment_row.payment_status <> 'initialized' or payment_row.order_status <> 'pending_payment' then
    raise exception 'Order is not awaiting payment';
  end if;
  if payment_row.amount_minor <> p_amount_minor or p_currency is distinct from 'NGN' then
    raise exception 'Payment amount or currency does not match';
  end if;

  update public.payments
  set status = 'paid', updated_at = now()
  where id = payment_row.id;
  update public.orders
  set status = 'paid'
  where id = payment_row.order_id;

  return payment_row.order_id;
end;
$$;

create or replace function public.fail_paystack_checkout(p_reference text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_row record;
begin
  select payments.id, payments.order_id, payments.status
  into payment_row
  from public.payments
  where payments.provider_reference = p_reference
    and payments.provider = 'paystack'
  for update;

  if not found or payment_row.status = 'paid' then
    return false;
  end if;
  if payment_row.status = 'failed' then
    return true;
  end if;

  update public.products p
  set stock = p.stock + items.quantity
  from public.order_items items
  where items.order_id = payment_row.order_id
    and items.product_id = p.id;
  update public.orders
  set status = 'cancelled'
  where id = payment_row.order_id and status = 'pending_payment';
  update public.payments
  set status = 'failed', updated_at = now()
  where id = payment_row.id;
  return true;
end;
$$;

revoke all on function public.create_paystack_checkout(uuid, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.complete_paystack_checkout(text, bigint, text) from public, anon, authenticated;
revoke all on function public.fail_paystack_checkout(text) from public, anon, authenticated;
grant execute on function public.create_paystack_checkout(uuid, jsonb, text, text) to service_role;
grant execute on function public.complete_paystack_checkout(text, bigint, text) to service_role;
grant execute on function public.fail_paystack_checkout(text) to service_role;