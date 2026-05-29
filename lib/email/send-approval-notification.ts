import { Resend } from 'resend';
import { formatAmount } from '@/lib/format/currency';
import { buildEmailHtml, escapeHtml } from './email-html-template';

interface ApprovalParams {
  to: string;
  creditorName: string;
  bookName: string;
  amount: number;
  currency: string;
  remainingDebt: number;
  dashboardUrl: string;
}

export async function sendApprovalNotification(p: ApprovalParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fmt = formatAmount(p.amount, p.currency);
  const fmtRemaining = formatAmount(Math.max(0, p.remainingDebt), p.currency);
  const isPaid = p.remainingDebt <= 0;

  const content = `
    <p style="color:#555;font-size:15px;margin:0 0 16px">
      Thanh toán của bạn trong sổ <strong>${escapeHtml(p.bookName)}</strong> đã được
      <strong>${escapeHtml(p.creditorName)}</strong> duyệt thành công.
    </p>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 12px">
      <p style="margin:0;font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Đã duyệt</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#111">${fmt}</p>
    </div>
    <div style="background:${isPaid ? '#f0fdf4' : '#fefce8'};border-radius:8px;padding:16px;margin:0 0 8px;border:1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}">
      <p style="margin:0;font-size:13px;color:${isPaid ? '#16a34a' : '#b45309'};font-weight:600;text-transform:uppercase;letter-spacing:0.5px">
        ${isPaid ? 'Đã thanh toán xong' : 'Còn lại'}
      </p>
      <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#111">${isPaid ? '0' : fmtRemaining}</p>
      ${isPaid ? '<p style="margin:6px 0 0;font-size:13px;color:#16a34a">Bạn đã thanh toán toàn bộ khoản nợ!</p>' : ''}
    </div>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — Thanh toán ${fmt} đã được duyệt`,
    html: buildEmailHtml({
      content,
      ctaLabel: 'Xem lịch sử thanh toán',
      ctaUrl: p.dashboardUrl,
    }),
  });
}
