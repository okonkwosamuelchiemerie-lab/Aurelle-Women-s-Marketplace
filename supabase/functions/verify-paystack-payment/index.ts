import {
  createAdminClient,
  getActiveBuyer,
  isAllowedOrigin,
  jsonResponse,
  optionsResponse,
  paystackSecret,
  verifyPaystackReference,
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
    if (!user) return jsonResponse(request, { error: "Sign in with your buyer account to verify this payment" }, 401);
    const body = await request.json();
    const reference = typeof body?.reference === "string" ? body.reference : "";
    if (!/^AUR-[0-9a-f-]{36}$/i.test(reference)) {
      return jsonResponse(request, { error: "Invalid payment reference" }, 400);
    }

    const admin = createAdminClient();
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id, order_id, amount_minor, status")
      .eq("provider", "paystack")
      .eq("provider_reference", reference)
      .maybeSingle();
    if (paymentError || !payment) return jsonResponse(request, { error: "Payment record not found" }, 404);

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("buyer_id, status")
      .eq("id", payment.order_id)
      .maybeSingle();
    if (orderError || !order || order.buyer_id !== user.id) {
      return jsonResponse(request, { error: "Payment does not belong to this buyer" }, 404);
    }
    if (payment.status === "paid" && order.status === "paid") {
      return jsonResponse(request, { ok: true, order_id: payment.order_id });
    }

    const transaction = await verifyPaystackReference(reference, secret);
    if (transaction.domain !== "test" || transaction.reference !== reference || transaction.status !== "success") {
      return jsonResponse(request, { error: "Paystack has not confirmed this payment yet" }, 409);
    }
    if (transaction.amount !== Number(payment.amount_minor) || transaction.currency !== "NGN") {
      return jsonResponse(request, { error: "Verified payment amount or currency does not match the order" }, 409);
    }

    const { data: orderId, error: completeError } = await admin.rpc("complete_paystack_checkout", {
      p_reference: reference,
      p_amount_minor: transaction.amount,
      p_currency: transaction.currency,
    });
    if (completeError || !orderId) {
      console.error("Could not mark verified Paystack payment complete", completeError);
      return jsonResponse(request, { error: "Payment verified but order confirmation needs retry" }, 500);
    }
    return jsonResponse(request, { ok: true, order_id: orderId });
  } catch (error) {
    console.error("Paystack verification failed", error);
    return jsonResponse(request, { error: "Could not verify this payment. Try again shortly." }, 502);
  }
});