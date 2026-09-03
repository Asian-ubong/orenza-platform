import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);

// These are browser-safe Supabase project identifiers. Never put a service-role secret here.
const FALLBACK_SUPABASE_URL = 'https://snqfmhvumqpizjhqopoh.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mHevxxxy7xzWvcx4JxVp5w_6xgRLhVQ';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (!request.nextUrl.pathname.startsWith('/admin')) return response;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY
  );

  let supabaseResponse = response;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/private-access', request.url));

  const { data: access } = await supabase
    .from('orenza_private_access')
    .select('role,status')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!access || !ADMIN_ROLES.has(String(access.role).toUpperCase())) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
