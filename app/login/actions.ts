'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const auth = createAuth(getDB());
  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch {
    return { error: 'Email hoặc mật khẩu không đúng.' };
  }

  redirect('/books');
}
