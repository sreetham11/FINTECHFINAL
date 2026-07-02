import { createSupabaseServerClient } from '@/lib/supabase/server';
import { syncUserRecord } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      // Ensure the local user record exists, using the verified identity from
      // the exchanged session (not client-supplied values). Upsert directly
      // instead of an internal fetch, which would drop the session cookies.
      try {
        await syncUserRecord({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name,
        });
      } catch (err) {
        console.error('Failed to sync user after OAuth:', err);
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
