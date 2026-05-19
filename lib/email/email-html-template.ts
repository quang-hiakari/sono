export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface EmailTemplateOptions {
  content: string;
  ctaLabel: string;
  ctaUrl: string;
  footerText?: string;
}

export function buildEmailHtml({ content, ctaLabel, ctaUrl, footerText }: EmailTemplateOptions): string {
  return `
<div style="background:#f2f2f2;padding:48px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="background:#ffffff;max-width:480px;margin:0 auto;border-radius:12px;overflow:hidden">
    <div style="padding:40px">
      <div style="margin-bottom:28px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#111;line-height:1;letter-spacing:-0.5px">SoNo</div>
        <div style="font-size:11px;color:#aaa;margin-top:3px;letter-spacing:1px">SỔ NỢ GIA ĐÌNH</div>
      </div>
      ${content}
      <div style="margin-top:28px">
        <a href="${ctaUrl}" style="display:inline-block;background:#2bb5a0;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px">
          ${ctaLabel}
        </a>
      </div>
    </div>
    ${footerText ? `
    <div style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:12px;margin:0;line-height:1.6">${footerText}</p>
    </div>` : ''}
  </div>
</div>`;
}
