import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (client) return client;

  // Supabase now supports publishable keys alongside the legacy anon key.
  // Both are browser-safe; never fall back to a server/service-role secret here.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );

  if (!url || !key) {
    throw new Error(
      'SUPABASE_BROWSER_CONFIG_MISSING: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in the deployment environment.'
    );
  }

  client = createBrowserClient(url, key);
  return client;
}
