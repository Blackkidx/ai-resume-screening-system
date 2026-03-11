import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
APP_NAME = "InternScreen"


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """ส่ง email ผ่าน SMTP — returns True ถ้าสำเร็จ"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"⚠️ EMAIL SERVICE: SMTP credentials not configured. OTP for {to_email}: (check server logs)")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{APP_NAME} <{SMTP_EMAIL}>"
        msg["To"] = to_email

        part = MIMEText(html_body, "html", "utf-8")
        msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False


def _otp_email_html(full_name: str, otp: str, purpose: str, expiry_minutes: int) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px;
                  box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
               padding: 32px 40px; text-align: center; }}
    .header h1 {{ color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px; }}
    .header p {{ color: #94a3b8; font-size: 13px; margin: 6px 0 0; }}
    .body {{ padding: 40px; }}
    .greeting {{ color: #1e293b; font-size: 16px; margin-bottom: 24px; }}
    .otp-box {{ background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px;
                padding: 28px; text-align: center; margin: 24px 0; }}
    .otp-label {{ color: #64748b; font-size: 13px; margin: 0 0 12px; text-transform: uppercase;
                  letter-spacing: 1px; font-weight: 600; }}
    .otp-code {{ font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #0f3460;
                 font-family: 'Courier New', monospace; margin: 0; }}
    .expiry {{ color: #ef4444; font-size: 13px; margin-top: 12px; font-weight: 500; }}
    .info {{ color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 24px; }}
    .footer {{ background: #f8fafc; padding: 20px 40px; text-align: center;
               border-top: 1px solid #e2e8f0; }}
    .footer p {{ color: #94a3b8; font-size: 12px; margin: 0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 {APP_NAME}</h1>
      <p>AI-Powered Internship Screening Platform</p>
    </div>
    <div class="body">
      <p class="greeting">สวัสดีคุณ <strong>{full_name}</strong>,</p>
      <p class="info">รหัส OTP สำหรับ<strong>{purpose}</strong>ของคุณคือ:</p>
      <div class="otp-box">
        <p class="otp-label">รหัส OTP</p>
        <p class="otp-code">{otp}</p>
        <p class="expiry">⏱ หมดอายุใน {expiry_minutes} นาที</p>
      </div>
      <p class="info">
        ถ้าคุณไม่ได้ดำเนินการนี้ กรุณาเพิกเฉยต่ออีเมลนี้<br>
        อย่าแชร์รหัส OTP นี้กับผู้อื่น
      </p>
    </div>
    <div class="footer">
      <p>© 2025 {APP_NAME} · ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
    </div>
  </div>
</body>
</html>
"""


def send_otp_email(to_email: str, otp: str, full_name: str) -> bool:
    """ส่ง OTP สำหรับยืนยัน Email ตอน Register"""
    print(f"📧 [OTP] Sending registration OTP {otp} to {to_email}")
    html = _otp_email_html(full_name, otp, "การยืนยันอีเมล", 10)
    return _send_email(to_email, f"[{APP_NAME}] รหัส OTP ยืนยันอีเมลของคุณ", html)


def send_password_reset_email(to_email: str, otp: str, full_name: str) -> bool:
    """ส่ง OTP สำหรับ Reset Password"""
    print(f"📧 [RESET] Sending reset OTP {otp} to {to_email}")
    html = _otp_email_html(full_name, otp, "การรีเซ็ตรหัสผ่าน", 10)
    return _send_email(to_email, f"[{APP_NAME}] รหัส OTP รีเซ็ตรหัสผ่าน", html)
