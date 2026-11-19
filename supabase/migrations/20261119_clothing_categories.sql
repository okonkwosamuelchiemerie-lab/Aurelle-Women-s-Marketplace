update public.products
set category = 'womenswear'
where category in ('dresses', 'clothes');

update public.shops
set categories = case
  when 'womenswear' = any(categories) then array_remove(array_remove(categories, 'dresses'), 'clothes')
  else array_remove(array_remove(categories, 'dresses'), 'clothes') || array['womenswear']::text[]
end
where categories && array['dresses', 'clothes']::text[];

update public.seller_applications
set categories = case
  when 'womenswear' = any(categories) then array_remove(array_remove(categories, 'dresses'), 'clothes')
  else array_remove(array_remove(categories, 'dresses'), 'clothes') || array['womenswear']::text[]
end
where categories && array['dresses', 'clothes']::text[];
