import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { nextCookies } from 'better-auth/next-js';
import { drizzle } from 'drizzle-orm/d1';
import { Resend } from 'resend';
import * as schema from './db-schema';

export function createAuth(db: D1Database) {
  return betterAuth({
    database: drizzleAdapter(drizzle(db, { schema }), {
      provider: 'sqlite',
      schema,
    }),
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        sendVerificationOTP: async ({ email, otp }: { email: string; otp: string; type: string }) => {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: email,
            subject: `SoNo — Mã xác nhận: ${otp}`,
            html: `
              <div style="background:#f2f2f2;padding:48px 16px;font-family:sans-serif">
                <div style="background:#ffffff;max-width:480px;margin:0 auto;border-radius:8px;overflow:hidden">
                  <div style="padding:48px 40px;text-align:center">
                    <div style="margin-bottom:32px">
                      <div style="font-size:26px;font-weight:700;color:#111;line-height:1">SoNo</div>
                      <div style="font-size:12px;color:#888;margin-top:4px;letter-spacing:0.5px">SỔ NỢ GIA ĐÌNH</div>
                    </div>
                    <p style="color:#555;font-size:15px;margin:0 0 28px">Nhập mã này vào ứng dụng để đăng nhập:</p>
                    <div style="font-size:42px;font-weight:700;letter-spacing:14px;color:#111;margin:0 0 20px;font-variant-numeric:tabular-nums">${otp}</div>
                    <p style="color:#aaa;font-size:13px;margin:0 0 28px">Mã hết hạn sau <strong>10 phút</strong></p>
                    <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 28px">
                    <p style="color:#aaa;font-size:13px;margin:0 0 20px">Hoặc nhấn nút bên dưới:</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display:inline-block;background:#2bb5a0;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 48px;border-radius:6px">Đăng nhập</a>
                  </div>
                </div>
              </div>
            `,
          });
          if (result.error) {
            throw new Error(`Resend: ${result.error.message}`);
          }
        },
      }),
      nextCookies(), // sets session cookie via Next.js cookies() in Server Actions
    ],
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.NEXT_PUBLIC_APP_URL!,
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ''],
  });
}

export type Auth = ReturnType<typeof createAuth>;
