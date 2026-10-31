/**
 * Certificate Ready Email Template
 */
export const getCertificateTemplate = ({ userName, eventTitle, certificateUrl }) => {
  const currentYear = new Date().getFullYear();
  const subject = `Your Certificate for ${eventTitle} is Ready!`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Congratulations ${userName}!</h1>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Your Event Certificate is Ready</p>
      </div>
      <div style="padding: 28px; color: #334155; line-height: 1.6; text-align: center;">
        <p>You have successfully completed <strong>${eventTitle}</strong>.</p>
        <p>Your official verified certificate of completion has been generated and attached to your student profile.</p>
        <div style="margin: 28px 0;">
          <a href="${certificateUrl || 'http://localhost:5173/student/certificates'}" target="_blank" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">
            Download Certificate
          </a>
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        &copy; ${currentYear} Event Hub. All Rights Reserved.
      </div>
    </div>
  `;

  return { subject, html: htmlContent, text: `Congratulations! Your certificate for ${eventTitle} is ready.` };
};

export default getCertificateTemplate;
