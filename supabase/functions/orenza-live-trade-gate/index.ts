import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const db = createClient(url, key!);

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return Response.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  const { data: { user } } = await db.auth.getUser(auth.slice(7));
  if (!user) return Response.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });

  const { data: runtime, error } = await db
    .from("platform_runtime_controls")
    .select("sandbox_mode,real_payments_enabled,real_withdrawals_enabled,real_transfers_enabled,real_trading_enabled,real_profit_payout_enabled")
    .maybeSingle();
  if (error) return Response.json({ error: "RUNTIME_CONTROL_LOOKUP_FAILED" }, { status: 500 });

  if (!runtime || runtime.real_trading_enabled !== true) {
    return Response.json({ ok: false, status: "DISABLED", code: "REAL_TRADING_DISABLED", message: "Live-market execution is not enabled. No order was sent to the broker." }, { status: 423 });
  }

  return Response.json({ ok: false, status: "NOT_IMPLEMENTED", code: "PROVIDER_EXECUTION_REQUIRES_EXPLICIT_PRODUCTION_SETUP", message: "Production broker credentials, account authorization, reconciliation, and deployment configuration are required before any live order can be submitted." }, { status: 503 });
});
