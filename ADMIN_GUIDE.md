# Aurelle owner guide (plain steps)

## 1. Become the admin (do this once)
1. Open your site and sign up as a normal BUYER with okonkwosamuelchiemerie@gmail.com. Confirm the email if Supabase sends one.
2. Log in once, then log out.
3. Go to supabase.com -> your project -> left menu **SQL Editor** -> **New query**.
4. Paste this, then click **Run**:

   update public.profiles set role = 'admin' where id = (select id from auth.users where email = lower('okonkwosamuelchiemerie@gmail.com'));

5. It should say "Success. 1 row affected" (or similar). If it says 0 rows, the sign-up in step 1 didn't finish.
6. Log in on your site again. You will now see the Admin panel (link: your-site/#/admin).

## 2. See your users
- On the site: Admin -> **Users** tab (every buyer and seller, with suspend/reactivate).
- In Supabase: **Authentication -> Users** (email, sign-up date, last login).
- Seller applications: Supabase **Table Editor -> seller_applications**. Approve shops on the site: Admin -> **Sellers**.

If a user appears under Supabase **Authentication -> Users** but not in the admin panel, run
`supabase/migrations/20261119_admin_list_users.sql` in the SQL Editor, then refresh the site. It installs the admin user-list function and creates missing profile rows for existing Auth users.

## 3. See what happens on your site
- **Orders and payments:** Supabase Table Editor -> `orders` and `payments` (or Admin -> Orders on the site).
- **Messages:** Table Editor -> `messages`.
- **Errors in checkout:** Supabase -> **Edge Functions** -> pick a function -> **Logs**.
- **Money:** Paystack dashboard -> Transactions (switch to Test mode while testing).
- **Visitors:** Netlify -> your site -> Analytics (paid add-on); free alternative is adding Google Analytics later.

## Passwords
- Forgot password: login page -> "Forgot your password?" (needs Supabase email: Authentication -> Emails -> SMTP Settings).
- Change password: buyer Profile tab, seller Shop tab, Admin -> Settings.
- Emergency reset by SQL (SQL Editor): update auth.users set encrypted_password = extensions.crypt('NewPassword1', extensions.gen_salt('bf')) where email = 'someone@mail.com' returning email;
