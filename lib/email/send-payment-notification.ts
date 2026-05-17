import { Resend } from 'resend';
import { formatAmount } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/date';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface PaymentNotificationParams {
  to: string;
  debtorName: string;
  amount: number;
  currency?: string;
  note?: string | null;
  createdAt: string;
  receiptUrl: string | null;
  approvalUrl: string;
}

export async function sendPaymentNotification(p: PaymentNotificationParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const vnd = formatAmount(p.amount, p.currency ?? 'VND');
  const dt = formatDateTime(p.createdAt);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — ${p.debtorName} gửi ${vnd} chờ bạn duyệt`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e40af; margin-bottom: 16px;">Có thanh toán chờ duyệt</h2>
        <p><strong>${escapeHtml(p.debtorName)}</strong> vừa gửi thanh toán <strong>${vnd}</strong> lúc ${dt}.</p>
        ${p.note ? `<p>Ghi chú: ${escapeHtml(p.note)}</p>` : ''}
        ${p.receiptUrl ? `<p><a href="${p.receiptUrl}" style="color: #2563eb;">Xem biên lai</a> (hết hạn sau 7 ngày)</p>` : ''}
        <p style="margin-top: 24px;">
          <a href="${p.approvalUrl}" style="background: #1e40af; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Duyệt thanh toán
          </a>
        </p>
      </div>
    `,
  });
}
