# Paystack test checkout

Checkout is test-mode only. The Edge Functions reject live Paystack keys and only mark an order paid after server-side verification of the reference, NGN currency, and exact amount. Seller transfers are not implemented; funds are not automatically paid out to sellers.

## Deploy the backend

1. Apply `migrations/20261118_paystack_test_checkout.sql` in the Supabase SQL Editor.
2. In Paystack test mode, copy the test secret key. Never put it in `js/config.js` or send it in chat.
3. Add these Edge Function secrets in Supabase Dashboard > Edge Functions > Secrets:
   - `PAYSTACK_SECRET_KEY`: Paystack test secret beginning with `sk_test_`.
   - `SITE_URL`: the exact frontend origin, such as `https://aurelle-marketplace.netlify.app`.
   - `PAYSTACK_WEBHOOK_SECRET`: optional webhook signing secret, if configured. Without it, the webhook uses the test secret key for the legacy `x-paystack-signature` format.
4. Deploy `create-paystack-checkout`, `verify-paystack-payment`, and `paystack-webhook` from `supabase/functions/`. The webhook is configured without JWT verification because Paystack signs its requests; the handler verifies that signature itself.
5. In Paystack's test-mode webhook settings, set the URL to `https://<project-ref>.supabase.co/functions/v1/paystack-webhook` and subscribe to `charge.success`.

With the Supabase CLI already installed and linked, the commands are:

```powershell
supabase functions deploy create-paystack-checkout
supabase functions deploy verify-paystack-payment
supabase functions deploy paystack-webhook
```

For local development, serve the site over HTTP (the README's `python -m http.server 8766` command is supported for CORS). Add `http://localhost:8766` as the `SITE_URL` while testing locally.

## Test flow

Use a buyer account and products from one approved shop. Paystack returns to `#/payment-result`; the buyer's browser then asks the server to verify the transaction. A signed `charge.success` webhook is also processed idempotently. Orders are not marked paid based on the browser redirect alone.

Test-mode checkout does not make the marketplace ready for live sales. Live keys, refunds, seller payouts, and settlement/reconciliation rules require separate implementation and review.