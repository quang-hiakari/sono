import { Resend } from 'resend';
import { formatVND } from '@/lib/format/currency';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface RejectionParams {
  to: string;
  creditorName: string;
  amount: number;
  reason: string | null;
  dashboardUrl: string;
}

export async function sendRejectionNotification(p: RejectionParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const vnd = formatVND(p.amount);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `SoNo — Thanh toán ${vnd} bị từ chối`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">Thanh toán bị từ chối</h2>
        <p>Thanh toán <strong>${vnd}</strong> của bạn đã bị <strong>${escapeHtml(p.creditorName)}</strong> từ chối.</p>
        ${p.reason ? `<p>Lý do: <em>${escapeHtml(p.reason)}</em></p>` : ''}
        <p>Bạn có thể nộp lại thanh toán sau khi kiểm tra lại biên lai.</p>
        <p style="margin-top: 24px;">
          <a href="${p.dashboardUrl}" style="background: #1e40af; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Xem lịch sử thanh toán
          </a>
        </p>
      </div>
    `,
  });
}
