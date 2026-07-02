/**
 * Demo seed: force a user's NETS Miles total to a specific number so each tier's
 * unlocked state can be shown live without grinding real activity.
 *
 * Usage:
 *   npm run seed:miles -- <email> <miles>
 *   e.g.  npm run seed:miles -- demo@nets.sg 150     # Adventurer
 *         npm run seed:miles -- demo@nets.sg 350     # NETS Legend
 *
 * It sets User.miles absolutely and replaces the miles log with a single "seed"
 * entry so the total and the log stay consistent.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Match the app: Prisma CLI/scripts don't auto-load .env.local, so do it here.
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });

const TIERS = [
  { label: 'Explorer', min: 0, max: 100 },
  { label: 'Adventurer', min: 101, max: 300 },
  { label: 'NETS Legend', min: 301, max: Infinity },
];
const tierFor = (m: number) => TIERS.find((t) => m >= t.min && m <= t.max)?.label ?? 'Explorer';

async function main() {
  const [email, milesArg] = process.argv.slice(2);
  if (!email || milesArg === undefined) {
    console.error('Usage: npm run seed:miles -- <email> <miles>');
    process.exit(1);
  }
  const miles = Number(milesArg);
  if (!Number.isFinite(miles) || miles < 0) {
    console.error(`Invalid miles value: "${milesArg}" (must be a non-negative number)`);
    process.exit(1);
  }

  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nets_quest?schema=public';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
    if (!user) {
      console.error(`No user found with email "${email}". Sign up / log in as them first.`);
      process.exit(1);
    }

    await prisma.$transaction([
      prisma.milesLog.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({ where: { id: user.id }, data: { miles } }),
      prisma.milesLog.create({
        data: { userId: user.id, reason: 'seed', miles, eventKey: `seed:${Date.now()}` },
      }),
    ]);

    console.log(`✓ ${user.name} <${email}> → ${miles} miles  (tier: ${tierFor(miles)})`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
