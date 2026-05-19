export const runtime = 'edge';

import { getBanksByCountry } from '@/lib/queries/banks';

export async function GET(req: Request) {
  const country = new URL(req.url).searchParams.get('country') ?? 'VN';
  const banks = await getBanksByCountry(country);
  return Response.json({ banks });
}
