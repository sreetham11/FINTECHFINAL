import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication.
// NOTE: /api/auth/register is intentionally NOT here — it derives the user from
// the verified session, so it must run through the auth check below.
const PUBLIC_API_ROUTES = [
  '/api/auth/callback',
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Only apply auth middleware to /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return supabaseResponse;
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Also allow cron routes with a secret header
  if (request.nextUrl.pathname.startsWith('/api/cron')) {
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret === process.env.CRON_SECRET) {
      return supabaseResponse;
    }
  }

  // Without Supabase env configured we can't create a client. Rather than throw
  // (which 500s the request), skip the middleware auth check and let the route
  // handler enforce auth itself — it returns a clean 401 via getAuthUser().
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user and hitting a protected API route, return 401
  if (!user && request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
