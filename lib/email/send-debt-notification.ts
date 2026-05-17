import { Resend } from 'resend';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface DebtNotificationParams {
  to: string;
  creditorName: string;
  bookName: string;
  title: string;
  amount: number;
  currency: string;
  debtDate: string;
  dashboardUrl: string;
}

export async function sendDebtNotification(p: DebtNotificationParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fmt = formatAmount(p.amount, p.currency);
  const date = formatDate(p.debtDate);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — ${escapeHtml(p.creditorName)} ghi thêm khoản nợ ${fmt}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e40af; margin-bottom: 16px;">Khoản nợ mới</h2>
        <p><strong>${escapeHtml(p.creditorName)}</strong> vừa ghi thêm khoản nợ mới trong sổ <strong>${escapeHtml(p.bookName)}</strong>:</p>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;">${escapeHtml(p.title)}</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#dc2626;">${fmt}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${date}</p>
        </div>
        <p style="margin-top: 24px;">
          <a href="${p.dashboardUrl}" style="background: #1e40af; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Xem sổ nợ
          </a>
        </p>
      </div>
    `,
  });
}
