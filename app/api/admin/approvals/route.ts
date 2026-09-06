import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);

function adminDb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

async function actor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://snqfmhvumqpizjhqopoh.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'sb_publishable_mHevxxxy7xzWvcx4JxVp5w_6xgRLhVQ';
  const jar = await cookies();
  const supabase = createServerClient(url, key, { cookies: { getAll: () => jar.getAll(), setAll: () => {} } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: access } = await supabase.from('orenza_private_access').select('role,status').eq('user_id', user.id).eq('status', 'ACTIVE').maybeSingle();
  return access && ADMIN_ROLES.has(String(access.role).toUpperCase()) ? { id: user.id, role: String(access.role).toUpperCase() } : null;
}

export async function GET() {
  const user = await actor();
  if (!user) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });
  const db = adminDb();
  if (!db) return NextResponse.json({ error: 'Server authentication is not configured.' }, { status: 503 });
  const { data, error } = await db.from('orenza_payout_requests').select('id,user_id,amount,currency,payout_method,provider_adapter,status,created_at,metadata').eq('status', 'PENDING').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: 'Could not load pending approvals.' }, { status: 500 });
  return NextResponse.json({ approvals: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await actor();
  if (!user) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });
  const db = adminDb();
  if (!db) return NextResponse.json({ error: 'Server authentication is not configured.' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '').trim();
  const decision = String(body.decision || '').toUpperCase();
  const reason = String(body.reason || '').trim().slice(0, 500) || null;
  if (!id || !['APPROVED', 'DECLINED'].includes(decision)) return NextResponse.json({ error: 'Invalid approval decision.' }, { status: 400 });

  const { data: current, error: readError } = await db.from('orenza_payout_requests').select('id,status').eq('id', id).eq('status', 'PENDING').maybeSingle();
  if (readError) return NextResponse.json({ error: 'Could not verify approval state.' }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'Approval is no longer pending.' }, { status: 409 });

  // Owner approval is recorded, but provider execution remains disabled in sandbox-first mode.
  const nextStatus = decision === 'APPROVED' ? 'PROCESSING' : 'REJECTED';
  const { data: updated, error: updateError } = await db.from('orenza_payout_requests').update({ status: nextStatus }).eq('id', id).eq('status', 'PENDING').select('id,status').maybeSingle();
  if (updateError || !updated) return NextResponse.json({ error: 'Approval could not be committed.' }, { status: 409 });

  const { error: auditError } = await db.from('orenza_approval_audit').insert({ target_type: 'PAYOUT', target_id: id, decision, actor_user_id: user.id, previous_status: 'PENDING', new_status: nextStatus, reason });
  if (auditError) return NextResponse.json({ error: 'Decision committed but audit recording failed; manual review required.' }, { status: 500 });

  return NextResponse.json({ success: true, decision, status: nextStatus, execution: 'DISABLED' });
}
