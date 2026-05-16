import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';

export function createAuth(db: D1Database) {
  return betterAuth({
    database: drizzleAdapter(drizzle(db), { provider: 'sqlite' }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.NEXT_PUBLIC_APP_URL!,
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ''],
  });
}

export type Auth = ReturnType<typeof createAuth>;
