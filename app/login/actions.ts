'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

export async function sendOtp(email: string) {
  const auth = createAuth(getDB());
  try {
    await auth.api.sendVerificationOTP({
      body: { email, type: 'sign-in' },
      headers: await headers(),
    });
    return {};
  } catch {
    return { error: 'Không thể gửi mã. Kiểm tra lại email.' };
  }
}

export async function verifyOtp(email: string, otp: string) {
  const auth = createAuth(getDB());
  try {
    await auth.api.signInEmailOTP({
      body: { email, otp },
      headers: await headers(),
    });
  } catch {
    return { error: 'Mã không đúng hoặc đã hết hạn.' };
  }
  redirect('/books');
}
