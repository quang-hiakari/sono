import { Resend } from 'resend';
import { formatAmount } from '@/lib/format/currency';
import { buildEmailHtml, escapeHtml } from './email-html-template';

interface DebtDeletedParams {
  to: string;
  creditorName: string;
  bookName: string;
  debtTitle: string;
  amount: number;
  currency: string;
  reason: string | null;
  dashboardUrl: string;
}

export async function sendDebtDeletedNotification(p: DebtDeletedParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fmt = formatAmount(p.amount, p.currency);

  const content = `
    <p style="color:#555;font-size:15px;margin:0 0 16px">
      <strong>${escapeHtml(p.creditorName)}</strong> vừa xoá một khoản nợ trong sổ
      <strong>${escapeHtml(p.bookName)}</strong>.
    </p>
    <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:0 0 12px">
      <p style="margin:0 0 4px;font-size:13px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Đã xoá</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:#111">${escapeHtml(p.debtTitle)}</p>
      <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#111">${fmt}</p>
    </div>
    ${p.reason ? `
    <div style="border-left:3px solid #e2e8f0;padding:10px 14px;margin:0 0 12px;background:#f8fafc;border-radius:0 6px 6px 0">
      <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Lý do từ ${escapeHtml(p.creditorName)}</p>
      <p style="margin:0;font-size:14px;color:#334155">${escapeHtml(p.reason)}</p>
    </div>` : ''}
    <p style="color:#94a3b8;font-size:13px;margin:0">
      Khoản nợ này đã được đánh dấu xoá và không còn tính vào tổng dư nợ.
    </p>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — Khoản nợ "${escapeHtml(p.debtTitle)}" đã bị xoá`,
    html: buildEmailHtml({
      content,
      ctaLabel: 'Xem sổ nợ',
      ctaUrl: p.dashboardUrl,
    }),
  });
}
