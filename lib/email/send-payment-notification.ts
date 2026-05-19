import { Resend } from 'resend';
import { formatAmount } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/date';
import { buildEmailHtml, escapeHtml } from './email-html-template';

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
  const fmt = formatAmount(p.amount, p.currency ?? 'VND');
  const dt = formatDateTime(p.createdAt);

  const content = `
    <p style="color:#555;font-size:15px;margin:0 0 16px">
      <strong>${escapeHtml(p.debtorName)}</strong> vừa gửi thanh toán lúc ${dt}.
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:0 0 8px">
      <p style="margin:0;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Chờ duyệt</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#111">${fmt}</p>
      ${p.note ? `<p style="margin:8px 0 0;font-size:13px;color:#64748b">Ghi chú: ${escapeHtml(p.note)}</p>` : ''}
    </div>
    ${p.receiptUrl ? `
    <p style="margin:12px 0 0;font-size:13px;color:#64748b">
      <a href="${p.receiptUrl}" style="color:#2bb5a0;text-decoration:none;font-weight:500">Xem biên lai</a>
      <span style="color:#cbd5e1"> · hết hạn sau 7 ngày</span>
    </p>` : ''}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — ${p.debtorName} gửi ${fmt} chờ bạn duyệt`,
    html: buildEmailHtml({
      content,
      ctaLabel: 'Duyệt thanh toán',
      ctaUrl: p.approvalUrl,
    }),
  });
}
