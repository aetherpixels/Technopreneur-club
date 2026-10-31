/**
 * Password Reset HTML Email Template for Event Hub
 * 
 * @param {Object} data
 * @param {string} data.resetLink - Password reset URL containing token
 * @param {string} [data.userName] - Recipient user name
 * @returns {Object} { subject: string, html: string, text: string }
 */
export const getPasswordResetTemplate = ({ resetLink, userName = 'User' }) => {
  const currentYear = new Date().getFullYear();
  const subject = 'Reset Your Event Hub Password';

  const textContent = `Hello ${userName},\n\nWe received a request to reset the password for your Event Hub account.\n\nIf you made this request, click the link below to create a new password:\n${resetLink}\n\nNote: This password reset link will expire in 15 minutes for your account's security.\n\nIf you did not request a password reset, you can safely ignore this email.\n\nThank you,\nEvent Hub Team\nSmart Institutional Event Management System\n\nSecurity Notice:\n- Never share your password or this reset link with anyone.\n- Event Hub will never ask for your password via email.\n- This reset link can only be used once and expires automatically.\n\n© ${currentYear} Event Hub. All Rights Reserved.`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo-container { width: 56px; height: 56px; background-color: #ffffff; border-radius: 14px; margin: 0 auto 12px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .logo-text { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; margin: 0; }
    .tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #bfdbfe; margin-top: 4px; }
    .content { padding: 32px 28px; background-color: #ffffff; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { background-color: #2563eb; color: #ffffff !important; font-size: 15px; font-weight: 700; padding: 14px 32px; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); transition: all 0.2s ease; }
    .link-box { background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; word-break: break-all; font-family: monospace; font-size: 13px; color: #1e293b; margin-bottom: 20px; text-align: center; }
    .note-box { background-color: #fffbe6; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; font-size: 14px; color: #92400e; margin-bottom: 24px; }
    .footer { background-color: #f8fafc; padding: 24px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .security-notice { background-color: #ffffff; border-radius: 10px; padding: 14px 16px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
    .security-title { font-weight: 700; color: #334155; margin-bottom: 6px; }
    .security-list { margin: 0; padding-left: 18px; line-height: 1.6; }
    .copyright { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <div class="logo-container">
        <!-- Logo Emblem -->
        <span style="font-size: 26px; font-weight: 900; color: #2563eb;">EH</span>
      </div>
      <h1 class="logo-text">Event-HuB</h1>
      <div class="tagline">Smart Institutional Event Management System</div>
    </div>

    <!-- Main Content Body -->
    <div class="content">
      <h2 class="greeting">Hello ${userName},</h2>
      <p class="text">
        We received a request to reset the password for your <strong>Event Hub</strong> account.
      </p>
      <p class="text">
        If you made this request, please click the button below to create a new password.
      </p>

      <div class="btn-container">
        <a href="${resetLink}" target="_blank" class="btn">Reset My Password</a>
      </div>

      <p class="text" style="font-size: 13px; text-align: center; margin-bottom: 8px;">
        Or copy and paste the following link into your browser:
      </p>
      <div class="link-box">
        ${resetLink}
      </div>

      <div class="note-box">
        <strong>Note:</strong> This password reset link will expire in <strong>15 minutes</strong> for your account's security.
      </div>

      <p class="text">
        If you did <strong>not</strong> request a password reset, you can safely ignore this email. Your account will remain secure, and no changes will be made.
      </p>

      <p class="text">
        If you continue to experience issues accessing your account, please contact the Event Hub support team.
      </p>

      <p class="text" style="margin-top: 24px; margin-bottom: 0;">
        Thank you,<br>
        <strong>Event Hub Team</strong><br>
        <em style="font-size: 13px; color: #64748b;">Smart Institutional Event Management System</em>
      </p>
    </div>

    <!-- Footer with Security Notice & Support -->
    <div class="footer">
      <div class="security-notice">
        <div class="security-title">Security Notice</div>
        <ul class="security-list">
          <li>Never share your password or this reset link with anyone.</li>
          <li>Event Hub will never ask for your password via email.</li>
          <li>This reset link can only be used once and expires automatically.</li>
        </ul>
      </div>

      <div class="copyright">
        &copy; ${currentYear} Event Hub. All Rights Reserved.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html: htmlContent, text: textContent };
};

export default getPasswordResetTemplate;
