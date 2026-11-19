update public.products
set category = 'underwear'
where category = 'masks';

update public.shops
set categories = case
  when 'underwear' = any(categories) then array_remove(categories, 'masks')
  else array_remove(categories, 'masks') || array['underwear']::text[]
end
where 'masks' = any(categories);

update public.seller_applications
set categories = case
  when 'underwear' = any(categories) then array_remove(categories, 'masks')
  else array_remove(categories, 'masks') || array['underwear']::text[]
end
where 'masks' = any(categories);
