import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Next.js loads environment variables from .env.local during local development,
// but Prisma CLI doesn't do this by default. We load it manually here.
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nets_quest?schema=public',
  },
});
