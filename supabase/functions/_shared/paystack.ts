import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const siteUrl = (Deno.env.get("SITE_URL") || "https://aurelle-marketplace.netlify.app").replace(/\/$/, "");
const allowedOrigins = new Set([
  siteUrl,
  "http://localhost:8766",
  "http://127.0.0.1:8766",
]);

export function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || allowedOrigins.has(origin);
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

export function optionsResponse(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase service configuration is missing");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getActiveBuyer(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !supabaseUrl || !publicKey) return null;

  const userClient = createClient(supabaseUrl, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser(token);
  if (error || !user) return null;

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile || profile.role !== "buyer" || profile.status !== "active") return null;
  return user;
}

export function paystackSecret() {
  return Deno.env.get("PAYSTACK_SECRET_KEY") || "";
}

export function testSiteUrl() {
  return siteUrl;
}

export async function verifyPaystackReference(reference: string, secret: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const result = await response.json();
  if (!response.ok || !result?.status || !result?.data) {
    throw new Error(result?.message || "Paystack could not verify this transaction");
  }
  return result.data;
}

function constantTimeHexMatch(expected: string, supplied: string) {
  if (!/^[0-9a-f]{128}$/i.test(supplied) || expected.length !== supplied.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ supplied.toLowerCase().charCodeAt(index);
  }
  return mismatch === 0;
}

async function hmacSha512(secret: string, message: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, message));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyPaystackWebhookSignature(request: Request, rawBody: Uint8Array) {
  const modernHeader = request.headers.get("paystack-signature");
  const webhookSecret = Deno.env.get("PAYSTACK_WEBHOOK_SECRET") || "";
  if (modernHeader && webhookSecret) {
    let timestamp = "";
    const signatures: string[] = [];
    for (const part of modernHeader.split(",")) {
      const separator = part.indexOf("=");
      if (separator < 0) continue;
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (key === "t") timestamp = value;
      if (key === "v1") {
        const colon = value.indexOf(":");
        signatures.push(colon >= 0 ? value.slice(colon + 1) : value);
      }
    }
    const seconds = Number(timestamp);
    if (/^\d+$/.test(timestamp) && Number.isFinite(seconds) && Math.abs(Date.now() / 1000 - seconds) <= 300) {
      const prefix = new TextEncoder().encode(`${timestamp}.`);
      const signedBody = new Uint8Array(prefix.length + rawBody.length);
      signedBody.set(prefix);
      signedBody.set(rawBody, prefix.length);
      const expected = await hmacSha512(webhookSecret, signedBody);
      if (signatures.some((signature) => constantTimeHexMatch(expected, signature))) return true;
    }
  }

  const legacySignature = request.headers.get("x-paystack-signature") || "";
  const legacySecret = paystackSecret();
  if (legacySignature && legacySecret) {
    const expected = await hmacSha512(legacySecret, rawBody);
    if (constantTimeHexMatch(expected, legacySignature)) return true;
  }
  return false;
}