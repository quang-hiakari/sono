import { Resend } from 'resend';

interface InviteParams {
  to: string;
  creditorName: string;
  bookName: string;
  loginUrl: string;
}

export async function sendInviteEmail(p: InviteParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: p.to,
    subject: `${p.creditorName} đã tạo sổ nợ với bạn trên SoNo`,
    html: `
      <div style="background:#f2f2f2;padding:48px 16px;font-family:sans-serif">
        <div style="background:#ffffff;max-width:480px;margin:0 auto;border-radius:8px;overflow:hidden">
          <div style="padding:48px 40px;text-align:center">
            <div style="margin-bottom:32px">
              <div style="font-size:26px;font-weight:700;color:#111;line-height:1">SoNo</div>
              <div style="font-size:12px;color:#888;margin-top:4px;letter-spacing:0.5px">SỔ NỢ GIA ĐÌNH</div>
            </div>
            <p style="color:#555;font-size:15px;margin:0 0 16px;text-align:left">
              <strong>${p.creditorName}</strong> vừa tạo một sổ nợ với bạn trên SoNo:
            </p>
            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:0 0 24px;text-align:left">
              <p style="margin:0;font-size:15px;font-weight:600;color:#111">${p.bookName}</p>
            </div>
            <p style="color:#555;font-size:14px;margin:0 0 28px;text-align:left">
              Đăng nhập để xem chi tiết khoản nợ, gửi biên lai thanh toán và theo dõi lịch sử.
            </p>
            <a href="${p.loginUrl}" style="display:inline-block;background:#2bb5a0;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 48px;border-radius:6px">
              Đăng nhập SoNo
            </a>
            <p style="color:#aaa;font-size:12px;margin:24px 0 0">
              Nhập email <strong>${p.to}</strong> → nhận mã xác nhận → đăng nhập
            </p>
          </div>
        </div>
      </div>
    `,
  });
}
