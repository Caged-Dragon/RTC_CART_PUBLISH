import { Webhook } from "npm:standardwebhooks@1";

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const HOOK_SECRET = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "").replace(/^v1,whsec_/, "");

const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}";
let SUPABASE_SECRET_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
try {
  const parsed = JSON.parse(secretKeysRaw);
  SUPABASE_SECRET_KEY ||= parsed.default ?? Object.values(parsed)[0] ?? "";
} catch {}

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://cart.rtcrackers.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function db(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.set("apikey", SUPABASE_SECRET_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_SECRET_KEY}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.error || `Supabase request failed (${response.status})`);
  return data;
}

async function sendResend(from: string, to: string[], subject: string, html: string, textBody: string, idempotencyKey?: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to, subject, html, text: textBody }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || data?.name || `Resend failed (${response.status})`);
  return data;
}

async function resolveSender(purposeCode: string) {
  const purpose = await db(`/rest/v1/business_email_purposes?purpose_code=eq.${encodeURIComponent(purposeCode)}&select=email_purpose_id&limit=1`);
  const purposeId = purpose?.[0]?.email_purpose_id;
  if (!purposeId) throw new Error(`No email purpose configured for ${purposeCode}`);

  const addresses = await db(`/rest/v1/business_email_addresses?email_purpose_id=eq.${purposeId}&is_active=eq.true&select=business_email_id,email_address,display_name,is_primary&order=is_primary.desc,business_email_id.asc&limit=1`);
  const address = addresses?.[0];
  if (!address) throw new Error(`No active business email configured for ${purposeCode}`);

  const mailboxes = await db(`/rest/v1/mailboxes?business_email_id=eq.${address.business_email_id}&is_active=eq.true&is_sending_enabled=eq.true&select=mailbox_id&limit=1`);
  if (!mailboxes?.[0]) throw new Error(`No active sending mailbox configured for ${address.email_address}`);

  return { ...address, mailbox_id: mailboxes[0].mailbox_id };
}

async function logOutbound(sender: any, to: string, subject: string, textBody: string, html: string, resendEmailId: string | null) {
  const inserted = await db("/rest/v1/email_messages", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      mailbox_id: sender.mailbox_id,
      direction: "outbound",
      status: "sent",
      from_address: sender.email_address,
      from_name: sender.display_name,
      subject,
      text_body: textBody,
      html_body: html,
      sent_at: new Date().toISOString(),
      folder: "sent",
      snippet: textBody.slice(0, 240),
      resend_email_id: resendEmailId,
    }),
  });
  const messageId = inserted?.[0]?.email_message_id;
  if (messageId) {
    await db("/rest/v1/email_recipients", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ email_message_id: messageId, recipient_type: "to", email_address: to }),
    });
  }
  return messageId ?? null;
}

async function sendTransactional(payload: any, request: Request) {
  const action = payload?.action;
  if (!action) throw new Error("Missing email action");
  const recipient = String(payload?.toEmail ?? "").trim().toLowerCase();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error("Invalid recipient email");

  if (action === "order_confirmation" || action === "order_status") {
    const orderId = String(payload?.orderId ?? "").trim();
    if (!orderId) throw new Error("Missing order id");
    const orders = await db(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*,order_items(*)&limit=1`);
    const order = orders?.[0];
    if (!order) throw new Error("Order not found");
    if (String(order.customer_email ?? "").toLowerCase() !== recipient) throw new Error("Recipient does not match the order");

    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_SECRET_KEY, Authorization: authHeader } });
      if (!userResponse.ok) throw new Error("Unauthorized");
      const authUser = await userResponse.json();
      const users = await db(`/rest/v1/users?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=id&limit=1`);
      if (!users?.[0] || String(users[0].id) !== String(order.user_id ?? "")) throw new Error("Order access denied");
    } else if (String(payload?.guestTrackingToken ?? "") !== String(order.guest_tracking_token ?? "")) {
      throw new Error("Order access denied");
    }

    const sender = await resolveSender("orders");
    const customerName = [order.shipping_first_name, order.shipping_last_name].filter(Boolean).join(" ") || "Customer";
    const orderNumber = String(order.order_number);
    const items = (order.order_items ?? []).map((item: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(item.product_name)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${esc(item.quantity)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${Number(item.line_total ?? 0).toLocaleString("en-IN")}</td></tr>`).join("");
    const status = action === "order_status" ? String(payload?.status ?? order.status) : "pending";
    const subject = action === "order_confirmation" ? `RT Crackers order confirmation #${orderNumber}` : `RT Crackers order #${orderNumber} — ${status}`;
    const textBody = action === "order_confirmation"
      ? `Hello ${customerName}, your RT Crackers order #${orderNumber} has been received. Total: ₹${Number(order.total_amount ?? 0).toLocaleString("en-IN")}.`
      : `Hello ${customerName}, your RT Crackers order #${orderNumber} is now ${status}.`;
    const html = `<!doctype html><html><body style="margin:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#222"><div style="max-width:680px;margin:24px auto;background:#fff;padding:28px;border-radius:14px"><h1 style="margin:0 0 8px">RT Crackers</h1><p>Hello ${esc(customerName)},</p><p>${action === "order_confirmation" ? `We received your order <strong>#${esc(orderNumber)}</strong>.` : `Your order <strong>#${esc(orderNumber)}</strong> is now <strong>${esc(status)}</strong>.`}</p>${action === "order_confirmation" ? `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Item</th><th style="padding:8px;border-bottom:2px solid #ddd">Qty</th><th style="text-align:right;padding:8px;border-bottom:2px solid #ddd">Amount</th></tr></thead><tbody>${items}</tbody></table><p style="text-align:right;font-size:18px"><strong>Total: ₹${Number(order.total_amount ?? 0).toLocaleString("en-IN")}</strong></p>` : ""}<p style="margin-top:24px">Our Sivakasi team will contact you regarding stock, transport and payment confirmation.</p><p>Regards,<br>${esc(sender.display_name || "RT Crackers")}</p></div></body></html>`;
    const resend = await sendResend(`${sender.display_name || "RT Crackers"} <${sender.email_address}>`, [recipient], subject, html, textBody, `cart:${action}:${order.id}:${status}`);
    const messageId = await logOutbound(sender, recipient, subject, textBody, html, resend?.id ?? null);
    return { ok: true, messageId, resendEmailId: resend?.id ?? null };
  }

  if (action === "quotation") {
    const sender = await resolveSender("sales");
    const subject = String(payload?.subject || "RT Crackers quotation");
    const customerName = String(payload?.customerName || "Customer");
    const body = String(payload?.message || "Thank you for contacting RT Crackers.");
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>RT Crackers</h2><p>Hello ${esc(customerName)},</p><p>${esc(body).replace(/\n/g,"<br>")}</p><p>Regards,<br>${esc(sender.display_name || "RT Crackers Sales")}</p></div>`;
    const resend = await sendResend(`${sender.display_name || "RT Crackers Sales"} <${sender.email_address}>`, [recipient], subject, html, body, `cart:quotation:${recipient}:${subject}`);
    const messageId = await logOutbound(sender, recipient, subject, body, html, resend?.id ?? null);
    return { ok: true, messageId, resendEmailId: resend?.id ?? null };
  }

  throw new Error(`Unsupported email action: ${action}`);
}

function authEmailContent(action: string, user: any, emailData: any) {
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Customer";
  const redirect = emailData.redirect_to || emailData.site_url || "https://cart.rtcrackers.com/";
  const type = action === "signup" ? "email" : action;
  const tokenHash = emailData.token_hash;
  const confirmationUrl = tokenHash
    ? `${SUPABASE_URL}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(redirect)}`
    : redirect;
  const labels: Record<string, [string, string]> = {
    signup: ["Verify your RT Crackers account", "Welcome to RT Crackers. Please verify your email address to activate your customer account."],
    recovery: ["Reset your RT Crackers password", "We received a request to reset your RT Crackers password. Use the button below to continue."],
    magiclink: ["Your RT Crackers sign-in link", "Use the button below to sign in securely to your RT Crackers account."],
    email_change: ["Confirm your RT Crackers email address", "Please confirm your new email address for your RT Crackers account."],
    reauthentication: ["Verify your RT Crackers account", "Use the verification code below to continue."],
  };
  const [subject, intro] = labels[action] ?? ["RT Crackers account notification", "Please complete the requested account action."];
  const code = emailData.token || "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:28px;color:#222"><h1>RT Crackers</h1><p>Hello ${esc(name)},</p><p>${esc(intro)}</p>${code ? `<p style="font-size:28px;letter-spacing:6px;font-weight:700">${esc(code)}</p>` : ""}<p><a href="${esc(confirmationUrl)}" style="display:inline-block;padding:12px 18px;background:#d92d27;color:#fff;text-decoration:none;border-radius:8px">Continue securely</a></p><p style="font-size:12px;color:#666">If you did not request this, you can safely ignore this email.</p></div>`;
  const textBody = `${intro}\n\n${code ? `Verification code: ${code}\n\n` : ""}${confirmationUrl}`;
  return { subject, html, textBody, confirmationUrl };
}

async function handleAuthHook(req: Request) {
  if (!HOOK_SECRET) throw new Error("SEND_EMAIL_HOOK_SECRET is not configured");
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const webhook = new Webhook(HOOK_SECRET);
  const verified: any = webhook.verify(payload, headers);
  const user = verified.user;
  const emailData = verified.email_data;
  const action = String(emailData.email_action_type || "");
  const recipient = String(user.email || "").trim().toLowerCase();
  if (!recipient) throw new Error("Auth hook payload has no recipient email");

  const sender = await resolveSender("account");
  const { subject, html, textBody } = authEmailContent(action, user, emailData);
  const resend = await sendResend(`${sender.display_name || "RT Crackers Accounts"} <${sender.email_address}>`, [recipient], subject, html, textBody, `auth:${user.id}:${action}:${emailData.token_hash || emailData.token_hash_new || ""}`);
  await logOutbound(sender, recipient, subject, textBody, html, resend?.id ?? null);
  return json({});
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !RESEND_API_KEY) return json({ error: "Email service is not configured" }, 500);

  try {
    const isAuthHook = Boolean(req.headers.get("webhook-id") || req.headers.get("webhook-signature") || req.headers.get("webhook-timestamp"));
    if (isAuthHook) return await handleAuthHook(req);
    const payload = await req.json();
    return json(await sendTransactional(payload, req));
  } catch (error: any) {
    console.error("transactional-email error", error);
    return json({ error: error?.message || "Email delivery failed" }, 400);
  }
});
