import { Resend } from 'resend';
import { formatAmount } from '@/lib/format/currency';
import { buildEmailHtml, escapeHtml } from './email-html-template';

interface RejectionParams {
  to: string;
  creditorName: string;
  amount: number;
  currency?: string;
  reason: string | null;
  dashboardUrl: string;
}

export async function sendRejectionNotification(p: RejectionParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fmt = formatAmount(p.amount, p.currency ?? 'VND');

  const content = `
    <p style="color:#555;font-size:15px;margin:0 0 16px">
      Thanh toán của bạn đã bị <strong>${escapeHtml(p.creditorName)}</strong> từ chối.
    </p>
    <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:0 0 8px">
      <p style="margin:0;font-size:13px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Bị từ chối</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#111">${fmt}</p>
      ${p.reason ? `<p style="margin:8px 0 0;font-size:13px;color:#64748b">Lý do: <em>${escapeHtml(p.reason)}</em></p>` : ''}
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:12px 0 0">
      Bạn có thể nộp lại thanh toán sau khi kiểm tra lại biên lai.
    </p>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — Thanh toán ${fmt} bị từ chối`,
    html: buildEmailHtml({
      content,
      ctaLabel: 'Xem lịch sử thanh toán',
      ctaUrl: p.dashboardUrl,
    }),
  });
}
