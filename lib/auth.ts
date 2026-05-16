import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { drizzle } from 'drizzle-orm/d1';
import { Resend } from 'resend';

export function createAuth(db: D1Database) {
  return betterAuth({
    database: drizzleAdapter(drizzle(db), { provider: 'sqlite' }),
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600, // 10 minutes
        sendVerificationOTP: async ({ email, otp }) => {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: email,
            subject: `SoNo — Mã xác nhận: ${otp}`,
            html: `
              <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px">
                <div style="text-align:center;margin-bottom:24px">
                  <span style="font-size:24px;font-weight:bold;color:#1d4ed8">SoNo</span>
                  <p style="color:#64748b;font-size:14px;margin:4px 0 0">Sổ Nợ Gia Đình</p>
                </div>
                <p style="color:#334155">Mã đăng nhập của bạn:</p>
                <div style="background:#eff6ff;border-radius:12px;padding:24px;text-align:center;margin:16px 0">
                  <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1d4ed8">${otp}</span>
                </div>
                <p style="color:#94a3b8;font-size:13px">
                  Mã có hiệu lực trong <strong>10 phút</strong>.<br>
                  Không chia sẻ mã này với bất kỳ ai.
                </p>
              </div>
            `,
          });
        },
      }),
    ],
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.NEXT_PUBLIC_APP_URL!,
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ''],
  });
}

export type Auth = ReturnType<typeof createAuth>;
