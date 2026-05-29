'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';
import { verifyTurnstile } from '@/lib/turnstile';

export async function sendOtp(email: string, turnstileToken: string) {
  const valid = await verifyTurnstile(turnstileToken);
  if (!valid) return { error: 'Xác minh bot thất bại. Vui lòng thử lại.' };

  const auth = createAuth(getDB());
  try {
    await auth.api.sendVerificationOTP({
      body: { email, type: 'sign-in' },
      headers: await headers(),
    });
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[sendOtp]', msg);
    return { error: msg.includes('Resend') ? msg : 'Không thể gửi mã. Kiểm tra lại email.' };
  }
}

export async function verifyOtp(email: string, otp: string) {
  const auth = createAuth(getDB());
  try {
    await auth.api.signInEmailOTP({
      body: { email, otp },
      headers: await headers(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[verifyOtp]', msg);
    return { error: 'Mã không đúng hoặc đã hết hạn.' };
  }
  redirect('/books');
}
