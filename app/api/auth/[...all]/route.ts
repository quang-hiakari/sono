import { createAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';
import { toNextJsHandler } from 'better-auth/next-js';

export const runtime = 'edge';

export function GET(req: Request) {
  return toNextJsHandler(createAuth(getDB())).GET(req);
}

export function POST(req: Request) {
  return toNextJsHandler(createAuth(getDB())).POST(req);
}
