import { getDB } from '@/lib/db';

export interface UserProfile {
  id: string;
  full_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  bank_qr_url: string | null;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const db = getDB();
  return db.prepare('SELECT * FROM profiles WHERE id = ?')
    .bind(userId).first<UserProfile>();
}

export async function upsertProfile(userId: string, data: {
  full_name?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  bank_qr_url?: string | null;
}) {
  const db = getDB();
  await db.prepare(`
    INSERT INTO profiles (id, full_name, bank_name, account_number, account_holder, bank_qr_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      full_name = excluded.full_name,
      bank_name = excluded.bank_name,
      account_number = excluded.account_number,
      account_holder = excluded.account_holder,
      bank_qr_url = COALESCE(excluded.bank_qr_url, bank_qr_url),
      updated_at = excluded.updated_at
  `).bind(
    userId,
    data.full_name ?? null,
    data.bank_name ?? null,
    data.account_number ?? null,
    data.account_holder ?? null,
    data.bank_qr_url ?? null,
    Date.now()
  ).run();
}
