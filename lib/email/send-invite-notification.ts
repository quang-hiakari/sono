import { Resend } from 'resend';
import { buildEmailHtml, escapeHtml } from './email-html-template';

interface InviteParams {
  to: string;
  creditorName: string;
  bookName: string;
  loginUrl: string;
}

export async function sendInviteEmail(p: InviteParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const content = `
    <p style="color:#555;font-size:15px;margin:0 0 16px">
      <strong>${escapeHtml(p.creditorName)}</strong> vừa tạo một sổ nợ với bạn trên SoNo:
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:0 0 16px">
      <p style="margin:0;font-size:15px;font-weight:600;color:#111">${escapeHtml(p.bookName)}</p>
    </div>
    <p style="color:#555;font-size:14px;margin:0">
      Đăng nhập để xem chi tiết khoản nợ, gửi biên lai thanh toán và theo dõi lịch sử.
    </p>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `${p.creditorName} đã tạo sổ nợ với bạn trên SoNo`,
    html: buildEmailHtml({
      content,
      ctaLabel: 'Đăng nhập SoNo',
      ctaUrl: p.loginUrl,
      footerText: `Nhập email <strong>${escapeHtml(p.to)}</strong> → nhận mã xác nhận → đăng nhập`,
    }),
  });
}
