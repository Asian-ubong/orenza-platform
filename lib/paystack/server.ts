import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getAdminDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVER_CREDENTIALS_NOT_CONFIGURED');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function requireUser(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('AUTHORIZATION_REQUIRED');
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) throw new Error('AUTHORIZATION_REQUIRED');
  const db = getAdminDb();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHORIZED');
  return { db, user: data.user };
}

export function jsonError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'REQUEST_FAILED';
  const safe = message.startsWith('PAYSTACK_API_ERROR:') ? message : message;
  return Response.json({ ok: false, error: safe }, { status });
}
