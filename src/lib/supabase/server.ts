import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { requireServerEnv } from '@/lib/env';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    requireServerEnv('SUPABASE_URL', 'https://placeholder.supabase.co'),
    requireServerEnv('SUPABASE_ANON_KEY', 'placeholder-key'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}

export function createSupabaseServiceClient() {
  return createClient(
    requireServerEnv('SUPABASE_URL', 'https://placeholder.supabase.co'),
    requireServerEnv('SUPABASE_SERVICE_ROLE_KEY', 'placeholder-key'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
