import sendEmail from '../utils/sendEmail.js';
import getPasswordResetTemplate from '../templates/passwordResetTemplate.js';
import getWelcomeTemplate from '../templates/welcomeTemplate.js';
import { getRegistrationTemplate, getEventApprovalTemplate } from '../templates/registrationTemplate.js';
import getCertificateTemplate from '../templates/certificateTemplate.js';

/**
 * High-Level Business Email Service for Event Hub.
 * Connects domain events with reusable templates and the low-level sendEmail utility.
 */

/**
 * Sends Password Reset Email
 */
export const sendPasswordResetEmail = async (toEmail, resetToken, userName = 'User') => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;
  const template = getPasswordResetTemplate({ resetLink, userName });

  return await sendEmail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Sends Welcome Account Activation Email
 */
export const sendWelcomeEmail = async (toEmail, { name, role, department }) => {
  const template = getWelcomeTemplate({ name, role, department });

  return await sendEmail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Sends Event Registration Confirmation Email
 */
export const sendEventRegistrationEmail = async (toEmail, { userName, eventTitle, eventDate, eventVenue }) => {
  const template = getRegistrationTemplate({ userName, eventTitle, eventDate, eventVenue });

  return await sendEmail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Sends Event Proposal Approval/Rejection Status Email
 */
export const sendEventApprovalStatusEmail = async (toEmail, { userName, eventTitle, status, reason }) => {
  const template = getEventApprovalTemplate({ userName, eventTitle, status, reason });

  return await sendEmail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Sends Certificate Ready Notification Email
 */
export const sendCertificateReadyEmail = async (toEmail, { userName, eventTitle, certificateUrl }) => {
  const template = getCertificateTemplate({ userName, eventTitle, certificateUrl });

  return await sendEmail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

export default {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendEventApprovalStatusEmail,
  sendCertificateReadyEmail,
};
