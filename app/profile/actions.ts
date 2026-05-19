'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { upsertProfile } from '@/lib/queries/profile';
import { getR2 } from '@/lib/r2';

export async function updateProfile(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return { error: 'Chưa đăng nhập.' };

  await upsertProfile(me.id, {
    full_name: (formData.get('full_name') as string)?.trim() || null,
    country: (formData.get('country') as string) || 'VN',
    bank_name: (formData.get('bank_name') as string)?.trim() || null,
    branch_name: (formData.get('branch_name') as string)?.trim() || null,
    account_number: (formData.get('account_number') as string)?.trim() || null,
    account_holder: (formData.get('account_holder') as string)?.trim() || null,
  });

  revalidatePath('/profile');
  revalidatePath('/books');
  return {};
}

export async function uploadQR(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return { error: 'Chưa đăng nhập.' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Không có ảnh.' };
  if (file.size > 3 * 1024 * 1024) return { error: 'Ảnh quá lớn (tối đa 3MB).' };

  const path = `qr/${me.id}.jpg`;
  const blob = await file.arrayBuffer();
  await getR2().put(path, blob, { httpMetadata: { contentType: 'image/jpeg' } });
  await upsertProfile(me.id, { bank_qr_url: path });

  revalidatePath('/profile');
  return { path };
}
