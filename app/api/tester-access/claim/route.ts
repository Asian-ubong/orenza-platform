import { createHash, randomBytes } from 'node:crypto';
import { getAdminDb, jsonError, requireUser } from '../../../../lib/paystack/server';

export const dynamic = 'force-dynamic';

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { db, user } = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!code) return Response.json({ ok: false, error: 'TESTER_CODE_REQUIRED' }, { status: 400 });

    const accessToken = randomBytes(32).toString('hex');
    const { data, error } = await db.rpc('orenza_claim_tester_invite', {
      p_user_id: user.id,
      p_code_hash: hash(code),
      p_access_token_hash: hash(accessToken),
    });
    if (error) throw new Error(error.message);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.ok) return Response.json(result ?? { ok: false, error: 'TESTER_ACCESS_DENIED' }, { status: 403 });

    const response = Response.json({ ok: true, access: 'TESTER', expires_at: result.expires_at, message: result.message }, { headers: { 'Cache-Control': 'no-store' } });
    response.headers.append('Set-Cookie', `orenza_tester_access=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600`);
    return response;
  } catch (error) {
    return jsonError(error, 401);
  }
}
