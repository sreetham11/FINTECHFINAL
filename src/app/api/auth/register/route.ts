import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, syncUserRecord } from '@/lib/auth';

// Only the display name is accepted from the client. The user id and email are
// taken from the verified Supabase session — never from the request body — so a
// caller cannot create or overwrite another user's record.
const RegisterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();

    let name: string | undefined;
    try {
      const body = await req.json();
      name = RegisterSchema.parse(body).name;
    } catch {
      // Body is optional — fall back to deriving a name from the email.
    }

    const user = await syncUserRecord({
      id: authUser.id,
      email: authUser.email,
      name,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error; // 401 from getAuthUser
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
