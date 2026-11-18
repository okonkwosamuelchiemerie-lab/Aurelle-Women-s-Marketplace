import {
  createAdminClient,
  jsonResponse,
  optionsResponse,
  verifyPaystackWebhookSignature,
} from "../_shared/paystack.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") return jsonResponse(request, { error: "Method not allowed" }, 405);

  try {
    const rawBody = new Uint8Array(await request.arrayBuffer());
    if (rawBody.length > 1024 * 1024) return jsonResponse(request, { error: "Payload too large" }, 413);
    const rawText = new TextDecoder().decode(rawBody);
    if (!await verifyPaystackWebhookSignature(request, rawBody)) {
      return jsonResponse(request, { error: "Invalid Paystack signature" }, 401);
    }

    const event = JSON.parse(rawText);
    if (event?.event !== "charge.success") return jsonResponse(request, { received: true });

    const reference = event?.data?.reference;
    const amount = event?.data?.amount;
    const currency = event?.data?.currency;
    if (event?.data?.domain !== "test" || typeof reference !== "string" || !Number.isInteger(amount) || typeof currency !== "string") {
      return jsonResponse(request, { error: "Invalid payment event" }, 400);
    }

    const admin = createAdminClient();
    const { error } = await admin.rpc("complete_paystack_checkout", {
      p_reference: reference,
      p_amount_minor: amount,
      p_currency: currency,
    });
    if (error) {
      console.error("Could not process signed Paystack event", error);
      return jsonResponse(request, { error: "Could not process payment event" }, 500);
    }
    return jsonResponse(request, { received: true });
  } catch (error) {
    console.error("Paystack webhook failed", error);
    return jsonResponse(request, { error: "Could not process payment event" }, 500);
  }
});