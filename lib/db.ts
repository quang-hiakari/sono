import { getRequestContext } from '@cloudflare/next-on-pages';

export function getDB(): D1Database {
  return getRequestContext().env.DB;
}
