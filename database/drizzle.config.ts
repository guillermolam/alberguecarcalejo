import type { Config } from 'drizzle-kit';

export default {
  schema: './database/schema.ts',
  out: './database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;