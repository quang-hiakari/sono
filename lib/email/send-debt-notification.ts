import { Resend } from 'resend';
import { formatAmount } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { buildEmailHtml, escapeHtml } from './email-html-template';

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

  const content = `
    <p style="color:#555;font-size:15px;margin:0 0 16px">
      <strong>${escapeHtml(p.creditorName)}</strong> vừa ghi thêm khoản nợ mới trong sổ
      <strong>${escapeHtml(p.bookName)}</strong>:
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:0 0 8px">
      <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111">${escapeHtml(p.title)}</p>
      <p style="margin:0;font-size:22px;font-weight:700;color:#dc2626">${fmt}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#94a3b8">${date}</p>
    </div>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — ${escapeHtml(p.creditorName)} ghi thêm khoản nợ ${fmt}`,
    html: buildEmailHtml({
      content,
      ctaLabel: 'Xem sổ nợ',
      ctaUrl: p.dashboardUrl,
    }),
  });
}
