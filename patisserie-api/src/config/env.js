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
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters (see .env.example)'),
  JWT_ACCESS_TTL: z.string().regex(/^\d+[smhd]$/, 'must look like 15m, 1h or 30s').default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
});

// Tests run without a .env file, so they get a throw-away secret. Every other
// environment must define its own in .env.
const input = { ...process.env };
if (input.NODE_ENV === 'test' && !input.JWT_ACCESS_SECRET) {
  input.JWT_ACCESS_SECRET = 'test-only-secret-that-is-long-enough-1234';
}

const parsed = schema
  .refine((e) => e.NODE_ENV !== 'production' || !e.JWT_ACCESS_SECRET.startsWith('change-me'), {
    path: ['JWT_ACCESS_SECRET'],
    message: 'replace the example value before running in production',
  })
  .safeParse(input);

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
