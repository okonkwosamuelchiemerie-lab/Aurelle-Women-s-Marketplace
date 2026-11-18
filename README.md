> NEW (read first): see `../PAYSTACK_SETUP_GUIDE.md` for the Paystack test setup.
> Sellers' photos are now shrunk automatically (max 1400px, high quality) before upload.
> Sellers can replace a product's photos from Dashboard -> Products -> Change photos.
> Being signed in now survives session renewals (no more bounce to the login page).

# Aurelle — Women's Marketplace (front end)

Plain HTML + CSS + JavaScript. No install, no build step.
Colours: light brown, brown and white (edit them at the top of `css/styles.css` under `:root`).

## Run it
- From this folder, run `python -m http.server 8766`, then open `http://127.0.0.1:8766`.
- Use the hosted Netlify URL to test the deployed site. Opening `index.html` directly as a `file://` URL is not recommended for account sign-up and login.

## Pages
- Landing page ......... `#/`  (visitors who are not logged in)
- Home page ............ `#/`  (after login: personal shortcuts, new arrivals, boutiques)
- About us ............. `#/about` (story, values, FAQ, contact form)
- Shop / category / product / seller shop pages, cart, checkout, messages, terms
- Buyer sign-up (simple) and Seller application (4 steps: details, business, location & delivery, branding & next steps)
- Seller dashboard, buyer dashboard
- Admin control panel .. `#/admin`

## Admin access
There is no default admin account or password. Create an account and confirm its email, then assign its profile the
`admin` role in the Supabase SQL Editor as described below. Never grant admin access from the browser. View registered
accounts in Supabase **Authentication → Users**. After changing the role, log out and back in. The admin screen can
list users, suspend/reactivate accounts, and approve/reject seller shops.

## Your details
Phone, email and address are set in `js/config.js` (BRAND and ADMIN_EMAIL) and show in the footer and About page.

## Folder map
- `index.html`     the single page that loads everything
- `css/styles.css` all the design
- `js/config.js`   brand name, contact details, commission (8% -> 7%), reward rules, categories, form choices
- `js/store.js`    the data layer (see "Backend" below)
- `js/ui.js`       small pieces: icons, product illustrations, product card, order card, header, footer
- `js/pages.js`    landing, browse, product, login, buyer dashboard, cart, checkout, messages, terms
- `js/pages2.js`   home, about, sign-up + seller application, shop page, seller dashboard, admin
- `js/app.js`      page switching, buttons and forms

The storefront does not seed sample sellers or products. Shops, listings, images, messages, profiles, and seller
applications are loaded from Supabase; only the buyer's cart is kept in browser storage.

## Backend setup (Supabase)
Buyer and seller sign-up/login use Supabase Auth. The Supabase project URL and browser-safe publishable key are configured
in `js/config.js`; never put a Supabase secret/service-role key in the site.

For a new Supabase project, run `supabase/schema.sql` once in the SQL Editor. It creates profiles, seller applications,
shops, products, orders, payment records, messaging, row-level security, and the product-image bucket. If the original
schema was already installed before the Auth integration, run `supabase/migrations/20261117_auth_signups.sql` once to
add the seller application fields and update the new-user trigger, then run
`supabase/migrations/20261117_live_marketplace.sql` to enable shop creation, approved-shop visibility, and admin tools.
If the site reports that it cannot load message contacts or find `message_contacts()`, run
`supabase/migrations/20261119_message_contacts.sql` in the Supabase SQL Editor.

Users appear under **Authentication → Users** after they sign up; email confirmation may be required before they can log
in. Seller application details are saved to `public.seller_applications`.

To create the first administrator:
1. Sign up through the site, confirm the account, and log in once.
2. In the SQL Editor, assign its profile role using the account's email:
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = lower('YOUR_ADMIN_EMAIL'));`

Buyer/seller authentication, profiles, seller applications, shop and product management, image uploads, messaging, and
admin user/shop management use Supabase. New seller shops remain hidden until an admin approves them. Paystack test-mode
checkout is implemented in Supabase Edge Functions; setup is documented in `supabase/PAYMENTS_SETUP.md`. Test mode does
not accept real money. Refunds, seller payouts, and settlement/reconciliation are not implemented. Changes made locally
must still be deployed to Supabase and Netlify before they appear on the public site.

