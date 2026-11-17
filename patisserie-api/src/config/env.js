import dotenv from 'dotenv';
import { z } from 'zod';

// Every setting is read and validated once, at boot: a missing or malformed value
// stops the process immediately instead of failing later on a request.
dotenv.config({ quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.url().default('mongodb://127.0.0.1:27017/patisserie'),
  CLIENT_ORIGIN: z.url().default('http://localhost:4200'),
  SEED_ADMIN_EMAIL: z.email().default('admin@patisserie.tn'),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  isDev: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',
});
