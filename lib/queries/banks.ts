import { getDB } from '@/lib/db';

export interface Bank {
  id: string;
  country: string;
  name: string;
  short_name: string;
  bin: string | null;
  swift: string | null;
}

export async function getBanksByCountry(country: string): Promise<Bank[]> {
  const db = getDB();
  const result = await db
    .prepare('SELECT * FROM banks WHERE country = ? ORDER BY short_name ASC')
    .bind(country)
    .all<Bank>();
  return result.results;
}
