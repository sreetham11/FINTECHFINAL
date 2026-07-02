import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Shared error handling for API route handlers so every route returns a
 * consistent JSON shape and status code. Handles the three error types that
 * recur across the codebase:
 *   - a NextResponse thrown by getAuthUser() (already a 401)
 *   - a ZodError from schema.parse() (→ 400 with details)
 *   - anything else (→ 500, logged server-side, no internals leaked)
 *
 * Usage:
 *   } catch (e) {
 *     return handleRouteError(e, 'POST /api/groups');
 *   }
 */
export function handleRouteError(error: unknown, context: string): NextResponse {
  if (error instanceof NextResponse) return error;

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request', details: error.issues },
      { status: 400 }
    );
  }

  console.error(`${context} error:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
