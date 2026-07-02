import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Upserts the local (Prisma) user record from a *verified* Supabase identity.
 * Never trust an id/email from the request body — always pass values that came
 * from supabase.auth.getUser() / exchangeCodeForSession(), never from the client.
 */
export async function syncUserRecord(params: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const name =
    params.name?.trim() || params.email.split('@')[0] || 'User';
  return prisma.user.upsert({
    where: { id: params.id },
    update: { email: params.email, name },
    create: { id: params.id, email: params.email, name },
  });
}

/**
 * Gets the authenticated user from the Supabase session.
 * Returns the user object or throws a 401 NextResponse.
 * Use in API routes: const user = await getAuthUser();
 */
export async function getAuthUser(): Promise<AuthUser> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return {
    id: user.id,
    email: user.email ?? '',
  };
}

/**
 * Wraps an API handler with auth. Returns 401 if not authed.
 * Usage: export const GET = withAuth(async (req, user) => { ... });
 */
export function withAuth<T>(
  handler: (req: Request, user: AuthUser) => Promise<NextResponse<T>>
) {
  return async (req: Request) => {
    try {
      const user = await getAuthUser();
      return await handler(req, user);
    } catch (e) {
      if (e instanceof NextResponse) return e;
      console.error('Auth error:', e);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
