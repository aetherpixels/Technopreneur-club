/**
 * Event Registration, Approval, and Rejection Templates
 */

export const getRegistrationTemplate = ({ userName, eventTitle, eventDate, eventVenue }) => {
  const currentYear = new Date().getFullYear();
  const subject = `Registration Confirmed: ${eventTitle}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #1e40af; padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">Event-HuB Registration Confirmed</h1>
      </div>
      <div style="padding: 28px; color: #334155; line-height: 1.6;">
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Your registration for <strong>${eventTitle}</strong> has been successfully confirmed!</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 4px 0;"><strong>Event:</strong> ${eventTitle}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin: 4px 0;"><strong>Venue:</strong> ${eventVenue}</p>
        </div>
        <p>Please present your student ID at the venue for attendance tracking.</p>
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        &copy; ${currentYear} Event Hub. All Rights Reserved.
      </div>
    </div>
  `;

  return { subject, html: htmlContent, text: `Registration confirmed for ${eventTitle} on ${eventDate}.` };
};

export const getEventApprovalTemplate = ({ userName, eventTitle, status = 'Approved', reason = '' }) => {
  const currentYear = new Date().getFullYear();
  const isApproved = status === 'Approved';
  const subject = `Event Proposal ${status}: ${eventTitle}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${isApproved ? '#10b981' : '#ef4444'}; padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">Event Status Update: ${status}</h1>
      </div>
      <div style="padding: 28px; color: #334155; line-height: 1.6;">
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Your event proposal for <strong>${eventTitle}</strong> has been <strong>${status}</strong> by the institutional administration.</p>
        ${reason ? `<p><strong>Feedback / Notes:</strong> ${reason}</p>` : ''}
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        &copy; ${currentYear} Event Hub. All Rights Reserved.
      </div>
    </div>
  `;

  return { subject, html: htmlContent, text: `Your event proposal for ${eventTitle} has been ${status}.` };
};
