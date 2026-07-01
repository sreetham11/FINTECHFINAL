import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const RegisterSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, name } = RegisterSchema.parse(body);

    // Upsert user — handles both new signups and re-registrations
    const user = await prisma.user.upsert({
      where: { id },
      update: { name, email },
      create: { id, email, name },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
