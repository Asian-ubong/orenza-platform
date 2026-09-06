import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

// Browser-safe Supabase project identifiers only. Never put service-role credentials here.
const FALLBACK_SUPABASE_URL = 'https://snqfmhvumqpizjhqopoh.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mHevxxxy7xzWvcx4JxVp5w_6xgRLhVQ';

/**
 * Single browser Supabase client for authenticated client components.
 * Deliberately uses createBrowserClient from @supabase/ssr; there is no
 * undeclared createClient reference in the browser bundle.
 */
export function getSupabaseBrowser() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  browserClient = createBrowserClient(url, key);
  return browserClient;
}
