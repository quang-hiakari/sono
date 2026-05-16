import { getRequestContext } from '@cloudflare/next-on-pages';

export function getR2(): R2Bucket {
  return getRequestContext().env.RECEIPTS;
}
