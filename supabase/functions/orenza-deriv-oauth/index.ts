import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const clientId = Deno.env.get("DERIV_CLIENT_ID");
const appId = Deno.env.get("DERIV_APP_ID") ?? clientId;
const clientSecret = Deno.env.get("DERIV_CLIENT_SECRET");
const redirectUri = Deno.env.get("DERIV_REDIRECT_URI");
const stateSecret = Deno.env.get("ORENZA_OAUTH_STATE_SECRET");
const fieldKey = Deno.env.get("FIELD_ENCRYPTION_KEY");
const appUrl = Deno.env.get("ORENZA_APP_URL");
const scopes = (Deno.env.get("DERIV_OAUTH_SCOPES") ?? "trade").trim();

const db = serviceKey ? createClient(supabaseUrl, serviceKey) : null;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});
function base64url(bytes: Uint8Array): string { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function decodeBase64Url(value: string): Uint8Array { const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4); return Uint8Array.from(atob(padded), c => c.charCodeAt(0)); }
function randomString(bytes = 32): string { const value = new Uint8Array(bytes); crypto.getRandomValues(value); return base64url(value); }
async function sha256(value: string): Promise<string> { return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))); }
async function hmac(value: string): Promise<string> { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(stateSecret!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))); }
function parseCookies(header: string): Record<string, string> { return Object.fromEntries(header.split(";").map(v => v.trim()).filter(Boolean).map(v => { const i = v.indexOf("="); return i < 0 ? [v, ""] : [v.slice(0, i), v.slice(i + 1)]; })); }
function cookie(name: string, value: string, maxAge: number): string { return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`; }
function redirect(location: string, clearState = false): Response { const headers = new Headers({ location, "cache-control": "no-store" }); if (clearState) headers.append("set-cookie", cookie("orenza_oauth_state", "", 0)); return new Response(null, { status: 302, headers }); }
function encryptionKeyBytes(): Uint8Array { if (!fieldKey) throw new Error("FIELD_ENCRYPTION_KEY_REQUIRED"); const raw = /^[0-9a-fA-F]{64}$/.test(fieldKey) ? Uint8Array.from(fieldKey.match(/.{2}/g)!.map(x => parseInt(x, 16))) : decodeBase64Url(fieldKey); if (raw.length !== 32) throw new Error("FIELD_ENCRYPTION_KEY_MUST_BE_32_BYTES"); return raw; }
async function encrypt(value: string): Promise<string> { const iv = crypto.getRandomValues(new Uint8Array(12)); const key = await crypto.subtle.importKey("raw", encryptionKeyBytes(), "AES-GCM", false, ["encrypt"]); const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value))); return `${base64url(iv)}.${base64url(ciphertext)}`; }
async function decrypt(value: string): Promise<string> { const [ivText, cipherText] = value.split("."); if (!ivText || !cipherText) throw new Error("INVALID_CIPHERTEXT"); const key = await crypto.subtle.importKey("raw", encryptionKeyBytes(), "AES-GCM", false, ["decrypt"]); const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decodeBase64Url(ivText) }, key, decodeBase64Url(cipherText)); return new TextDecoder().decode(plaintext); }
function requireConfig(): Response | null { if (!db || !clientId || !appId || !redirectUri || !stateSecret || !fieldKey || !appUrl) return json({ error: "OAUTH_CONFIGURATION_REQUIRED" }, 503); return null; }

Deno.serve(async (req) => {
  const configError = requireConfig(); if (configError) return configError;
  const url = new URL(req.url); const action = url.searchParams.get("action") ?? "start";

  if (action === "start") {
    const authorization = req.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "AUTHENTICATION_REQUIRED" }, 401);
    const { data: { user } } = await db!.auth.getUser(authorization.slice(7));
    if (!user) return json({ error: "AUTHENTICATION_REQUIRED" }, 401);
    const verifier = randomString(48); const challenge = await sha256(verifier);
    const statePayload = `${user.id}.${randomString(24)}`; const state = `${statePayload}.${await hmac(statePayload)}`;
    const { error } = await db!.from("oauth_sessions").insert({ user_id: user.id, provider: "DERIV", state_hash: await sha256(state), encrypted_code_verifier: await encrypt(verifier), redirect_uri: redirectUri, scopes: scopes.split(/\s+/).filter(Boolean), expires_at: new Date(Date.now() + 600000).toISOString() });
    if (error) return json({ error: "OAUTH_SESSION_CREATE_FAILED" }, 500);
    const authUrl = new URL("https://auth.deriv.com/oauth2/auth"); authUrl.searchParams.set("response_type", "code"); authUrl.searchParams.set("client_id", clientId!); authUrl.searchParams.set("redirect_uri", redirectUri!); authUrl.searchParams.set("scope", scopes); authUrl.searchParams.set("state", state); authUrl.searchParams.set("code_challenge", challenge); authUrl.searchParams.set("code_challenge_method", "S256");
    return new Response(null, { status: 302, headers: { location: authUrl.toString(), "set-cookie": cookie("orenza_oauth_state", state, 600), "cache-control": "no-store" } });
  }

  if (action === "callback") {
    const cookies = parseCookies(req.headers.get("cookie") ?? ""); const state = url.searchParams.get("state"); const code = url.searchParams.get("code");
    if (url.searchParams.get("error")) return redirect(`${appUrl}/private-access?error=DERIV_AUTH_DENIED`, true);
    if (!state || !code || cookies.orenza_oauth_state !== state) return json({ error: "OAUTH_STATE_MISMATCH" }, 400);
    const parts = state.split("."); if (parts.length !== 3 || await hmac(`${parts[0]}.${parts[1]}`) !== parts[2]) return json({ error: "INVALID_OAUTH_STATE" }, 400);
    const { data: session, error: sessionError } = await db!.from("oauth_sessions").select("id,user_id,encrypted_code_verifier,redirect_uri,scopes,expires_at,consumed_at").eq("state_hash", await sha256(state)).maybeSingle();
    if (sessionError || !session || session.consumed_at || new Date(session.expires_at).getTime() <= Date.now()) return json({ error: "OAUTH_SESSION_INVALID" }, 400);
    const { data: consumed } = await db!.from("oauth_sessions").update({ consumed_at: new Date().toISOString() }).eq("id", session.id).is("consumed_at", null).select("id");
    if (!consumed?.length) return json({ error: "OAUTH_SESSION_ALREADY_CONSUMED" }, 400);

    const verifier = await decrypt(session.encrypted_code_verifier);
    const form = new URLSearchParams({ grant_type: "authorization_code", client_id: clientId!, code, code_verifier: verifier, redirect_uri: redirectUri! }); if (clientSecret) form.set("client_secret", clientSecret);
    const tokenResponse = await fetch("https://auth.deriv.com/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
    if (!tokenResponse.ok) return json({ error: "DERIV_TOKEN_EXCHANGE_FAILED" }, 502); const token = await tokenResponse.json(); if (!token.access_token) return json({ error: "DERIV_TOKEN_MISSING" }, 502);

    const accountsResponse = await fetch("https://api.derivws.com/trading/v1/options/accounts", { headers: { Authorization: `Bearer ${token.access_token}`, "Deriv-App-ID": appId!, accept: "application/json" } });
    if (!accountsResponse.ok) return json({ error: "DERIV_ACCOUNT_LOOKUP_FAILED" }, 502); const accountPayload = await accountsResponse.json();
    const accounts = Array.isArray(accountPayload?.data) ? accountPayload.data : Array.isArray(accountPayload?.accounts) ? accountPayload.accounts : []; const refs = accounts.map((x: any) => String(x.id ?? x.account_id ?? "")).filter(Boolean);
    if (!refs.length) return json({ error: "DERIV_ACCOUNT_NOT_FOUND" }, 403);
    const { data: allowed, error: allowError } = await db!.from("orenza_private_access").select("user_id,provider,provider_account_reference,status,role").eq("user_id", session.user_id).eq("provider", "DERIV").eq("status", "ACTIVE").in("provider_account_reference", refs);
    if (allowError || !allowed?.length) return redirect(`${appUrl}/private-access?error=PRIVATE_ACCESS_DENIED`, true);

    const allowedRef = allowed[0].provider_account_reference as string; const account = accounts.find((x: any) => String(x.id ?? x.account_id ?? "") === allowedRef) ?? {};
    const accountType = String(account.account_type ?? account.type ?? "").toUpperCase(); const environment = accountType.includes("REAL") ? "REAL" : "DEMO"; const expiresAt = new Date(Date.now() + Number(token.expires_in ?? 3600) * 1000).toISOString();
    const common = { user_id: session.user_id, broker_code: "DERIV", environment, status: "ACTIVE", external_account_id: allowedRef, provider_account_reference: allowedRef, scopes: session.scopes, access_token_encrypted: await encrypt(String(token.access_token)), refresh_token_encrypted: token.refresh_token ? await encrypt(String(token.refresh_token)) : null, token_expires_at: expiresAt, last_connected_at: new Date().toISOString(), last_error: null, environment_guard: environment, metadata: { source: "oauth2_pkce", token_type: token.token_type ?? "Bearer" }, updated_at: new Date().toISOString() };
    const { data: existing } = await db!.from("broker_connections").select("id").eq("user_id", session.user_id).eq("broker_code", "DERIV").eq("environment", environment).eq("provider_account_reference", allowedRef).maybeSingle();
    if (existing?.id) await db!.from("broker_connections").update(common).eq("id", existing.id); else await db!.from("broker_connections").insert(common);
    const { data: derivExisting } = await db!.from("orenza_deriv_connections").select("id").eq("user_id", session.user_id).eq("deriv_account_id", allowedRef).maybeSingle();
    const derivCommon = { user_id: session.user_id, deriv_account_id: allowedRef, status: "ACTIVE", scopes: session.scopes, token_expires_at: expiresAt, last_sync_at: null, metadata: { environment, source: "oauth2_pkce" }, updated_at: new Date().toISOString() };
    if (derivExisting?.id) await db!.from("orenza_deriv_connections").update(derivCommon).eq("id", derivExisting.id); else await db!.from("orenza_deriv_connections").insert(derivCommon);
    await db!.from("security_events").insert({ user_id: session.user_id, event_type: "DERIV_OAUTH_CONNECTED", severity: "INFO", metadata: { provider: "DERIV", environment, scopes: session.scopes } });
    return redirect(`${appUrl}/private-access?connected=deriv`, true);
  }
  return json({ error: "UNKNOWN_ACTION" }, 400);
});
