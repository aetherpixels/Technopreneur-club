/**
 * Welcome HTML Email Template for Event Hub Registration
 * 
 * @param {Object} data
 * @param {string} data.name - User's full name
 * @param {string} data.role - User role (Student, Faculty, Admin)
 * @param {string} data.department - User department
 * @returns {Object} { subject: string, html: string, text: string }
 */
export const getWelcomeTemplate = ({ name = 'User', role = 'Student', department = 'CE' }) => {
  const currentYear = new Date().getFullYear();
  const subject = `Welcome to Event-HuB, ${name}!`;

  const textContent = `Hello ${name},\n\nWelcome to Event-HuB – Institutional Event Management System.\nYour ${role} account (${department} Department) has been successfully created.\n\nYou can now log in to discover events, track attendance, and download certificates.\n\nThank you,\nEvent Hub Team\n© ${currentYear} Event Hub. All Rights Reserved.`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0; }
    .content { padding: 32px 28px; }
    .btn { background-color: #2563eb; color: #ffffff !important; font-size: 15px; font-weight: 700; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; }
    .footer { background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="logo-text">Event-HuB</h1>
      <p style="margin: 4px 0 0; font-size: 12px; color: #bfdbfe;">Institutional Activity Portal</p>
    </div>
    <div class="content">
      <h2 style="color: #0f172a;">Welcome aboard, ${name}!</h2>
      <p style="color: #475569; line-height: 1.6;">
        Your <strong>${role}</strong> portal account for the <strong>${department}</strong> Department has been successfully activated.
      </p>
      <p style="color: #475569; line-height: 1.6;">
        You can now participate in department workshops, track attendance, and generate verified completion certificates.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="http://localhost:5173/login" target="_blank" class="btn">Log In to Your Portal</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} Event Hub. All Rights Reserved.
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html: htmlContent, text: textContent };
};

export default getWelcomeTemplate;
