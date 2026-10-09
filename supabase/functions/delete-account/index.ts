import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return new Response(JSON.stringify({ error: "Sign in before deleting your account." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) return new Response(JSON.stringify({ error: "Account deletion is not configured on the server." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    let body: { confirm?: boolean } = {};
    try { body = await req.json(); } catch { /* invalid body is rejected below */ }
    if (body.confirm !== true) return new Response(JSON.stringify({ error: "Explicit account deletion confirmation is required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
    if (!userResponse.ok) return new Response(JSON.stringify({ error: "Your session is invalid or expired. Sign in again." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const user = await userResponse.json();
    if (!user?.id) return new Response(JSON.stringify({ error: "Could not verify the signed-in account." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: "DELETE",
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    if (!deleteResponse.ok) {
      const details = await deleteResponse.text();
      console.error("Supabase admin user deletion failed", deleteResponse.status, details);
      return new Response(JSON.stringify({ error: "Supabase could not delete this account. Related records or database constraints may need review." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("delete-account unexpected error", error);
    return new Response(JSON.stringify({ error: "Unexpected account deletion error." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
