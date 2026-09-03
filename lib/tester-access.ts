import { createHash } from 'node:crypto';
import { getAdminDb, requireUser } from './paystack/server';

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function requireTesterAccess(request: Request) {
  const { db, user } = await requireUser(request);
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)orenza_tester_access=([^;]+)/);
  const token = match?.[1];
  if (!token) throw new Error('TESTER_ACCESS_REQUIRED');

  const { data, error } = await db.rpc('orenza_assert_tester_access', {
    p_user_id: user.id,
    p_access_token_hash: hash(token),
  });
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error('TESTER_ACCESS_EXPIRED_OR_REVOKED');
  return { db, user };
}
