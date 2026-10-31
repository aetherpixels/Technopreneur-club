import { transporter, emailConfig } from '../config/emailConfig.js';

/**
 * Low-level reusable email utility function.
 * Dispatches HTML and Plain Text emails using the centralized Nodemailer transporter.
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML formatted email body
 * @param {string} [options.text] - Optional plain text fallback body
 * @returns {Promise<Object>} Status object { success: boolean, messageId?: string, error?: string }
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to || !subject || (!html && !text)) {
    const errorMsg = 'Missing required email parameters (to, subject, html or text).';
    console.error('[SendEmail] Error:', errorMsg);
    return { success: false, error: errorMsg };
  }

  const senderAddress = process.env.EMAIL_FROM
    ? process.env.EMAIL_FROM.replace(/"/g, '')
    : `"${process.env.EMAIL_FROM_NAME || 'Event-HuB Portal'}" <${emailConfig.user || 'noreply@eventhub.edu'}>`;

  const mailOptions = {
    from: senderAddress,
    to: to.trim(),
    subject: subject.trim(),
    text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback plain text stripping HTML tags
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SendEmail] Success: Email dispatched to ${to} | MessageID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (error) {
    // Categorize and log error type
    let errorCategory = 'SendFailure';
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      errorCategory = 'SMTPAuthenticationFailure (Check EMAIL_USER / EMAIL_PASS App Password)';
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      errorCategory = 'NetworkFailure (Check internet connection & EMAIL_HOST / EMAIL_PORT)';
    } else if (error.responseCode >= 400 && error.responseCode < 500) {
      errorCategory = 'InvalidRecipient (Check email address format)';
    }

    console.error(`[SendEmail] Failure [${errorCategory}] for recipient ${to}:`, error.message);

    return {
      success: false,
      errorCategory,
      error: error.message,
    };
  }
};

export default sendEmail;
