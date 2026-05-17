import { Resend } from 'resend';
import { formatAmount } from '@/lib/format/currency';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface ApprovalParams {
  to: string;
  creditorName: string;
  amount: number;
  currency: string;
  dashboardUrl: string;
}

export async function sendApprovalNotification(p: ApprovalParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fmt = formatAmount(p.amount, p.currency);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — Thanh toán ${fmt} đã được duyệt`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">Thanh toán được duyệt</h2>
        <p>Thanh toán <strong>${fmt}</strong> của bạn đã được <strong>${escapeHtml(p.creditorName)}</strong> duyệt thành công.</p>
        <p style="margin-top: 24px;">
          <a href="${p.dashboardUrl}" style="background: #1e40af; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Xem lịch sử thanh toán
          </a>
        </p>
      </div>
    `,
  });
}
