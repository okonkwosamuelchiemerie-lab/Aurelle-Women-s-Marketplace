import {
  createAdminClient,
  getActiveBuyer,
  isAllowedOrigin,
  jsonResponse,
  optionsResponse,
  paystackSecret,
  testSiteUrl,
} from "../_shared/paystack.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") return jsonResponse(request, { error: "Method not allowed" }, 405);
  if (!isAllowedOrigin(request)) return jsonResponse(request, { error: "Origin is not allowed" }, 403);

  const secret = paystackSecret();
  if (!secret.startsWith("sk_test_")) {
    return jsonResponse(request, { error: "Paystack test mode is not configured" }, 503);
  }

  try {
    const user = await getActiveBuyer(request);
    if (!user?.email) return jsonResponse(request, { error: "Sign in with an active buyer account to continue" }, 401);

    const body = await request.json();
    const items = body?.items;
    const deliveryAddress = typeof body?.delivery_address === "string" ? body.delivery_address.trim() : "";
    if (!Array.isArray(items) || items.length === 0 || items.length > 30 || deliveryAddress.length < 8 || deliveryAddress.length > 1000) {
      return jsonResponse(request, { error: "Check your cart and delivery details" }, 400);
    }

    const reference = `AUR-${crypto.randomUUID()}`;
    const admin = createAdminClient();
    const { data: checkout, error: orderError } = await admin.rpc("create_paystack_checkout", {
      p_buyer_id: user.id,
      p_items: items,
      p_delivery_address: deliveryAddress,
      p_reference: reference,
    });
    if (orderError || !checkout) {
      return jsonResponse(request, { error: orderError?.message || "Could not create the order" }, 400);
    }

    try {
      const initializedResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: String(checkout.amount_minor),
          currency: "NGN",
          reference,
          callback_url: `${testSiteUrl()}/#/payment-result?reference=${encodeURIComponent(reference)}`,
          metadata: { order_id: checkout.order_id },
        }),
      });
      const initialized = await initializedResponse.json();
      if (!initializedResponse.ok || !initialized?.status || !initialized?.data?.authorization_url) {
        await admin.rpc("fail_paystack_checkout", { p_reference: reference });
        return jsonResponse(request, { error: initialized?.message || "Paystack could not start the test payment" }, 502);
      }
      return jsonResponse(request, {
        authorization_url: initialized.data.authorization_url,
        reference,
      });
    } catch (error) {
      await admin.rpc("fail_paystack_checkout", { p_reference: reference });
      throw error;
    }
  } catch (error) {
    console.error("Paystack checkout initialization failed", error);
    return jsonResponse(request, { error: "Could not start test checkout. Please try again." }, 500);
  }
});