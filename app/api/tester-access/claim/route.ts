import { createHash, randomBytes } from 'node:crypto';
import { jsonError } from '../../../../lib/paystack/server';

export const dynamic = 'force-dynamic';

const FALLBACK_SUPABASE_URL = 'https://snqfmhvumqpizjhqopoh.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mHevxxxy7xzWvcx4JxVp5w_6xgRLhVQ';
const TESTER_ACCESS_MAX_AGE = 14 * 24 * 60 * 60;

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
}

function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new Error('AUTHORIZATION_REQUIRED');
    const token = authorization.slice('Bearer '.length).trim();
    if (!token) throw new Error('AUTHORIZATION_REQUIRED');

    const db = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await db.auth.getUser(token);
    if (authError || !authData.user) throw new Error('UNAUTHORIZED');

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!code) return Response.json({ ok: false, error: 'TESTER_CODE_REQUIRED' }, { status: 400 });

    const accessToken = randomBytes(32).toString('hex');
    const { data, error } = await db.rpc('orenza_claim_tester_invite', {
      p_user_id: authData.user.id,
      p_code_hash: hash(code),
      p_access_token_hash: hash(accessToken),
    });
    if (error) throw new Error(error.message);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.ok) return Response.json(result ?? { ok: false, error: 'TESTER_ACCESS_DENIED' }, { status: 403 });

    const response = Response.json(
      { ok: true, access: 'TESTER', expires_at: result.expires_at, message: result.message },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    response.headers.append('Set-Cookie', `orenza_tester_access=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TESTER_ACCESS_MAX_AGE}`);
    return response;
  } catch (error) {
    return jsonError(error, 401);
  }
}
