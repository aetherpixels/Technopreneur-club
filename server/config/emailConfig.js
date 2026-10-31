import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized Email Configuration for Event Hub Backend
 * Handles SMTP transporter creation, environment credential reading,
 * and transporter connectivity verification.
 */

const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
const user = (process.env.EMAIL_USER || '').trim();
const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const from = process.env.EMAIL_FROM || 'noreply@eventhub.edu';

// Port 465 requires secure: true; port 587 or 2525 uses STARTTLS (secure: false)
const isSecure = port === 465;

export const emailConfig = {
  host,
  port,
  user,
  from,
};

/**
 * Creates and returns a Nodemailer Transporter instance
 */
export const createTransporter = () => {
  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    // Pool connections for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false, // Prevents self-signed SSL errors on localhost
    },
  });
};

// Singleton Transporter Instance
export const transporter = createTransporter();

/**
 * Verifies SMTP Transporter Connection
 */
export const verifyEmailConnection = async () => {
  if (!user || !pass) {
    console.warn('[EmailConfig] Warning: EMAIL_USER or EMAIL_PASS missing in .env. SMTP delivery may fail.');
    return false;
  }

  try {
    await transporter.verify();
    console.log(`[EmailConfig] SMTP Server Connected Successfully (${host}:${port})`);
    return true;
  } catch (error) {
    console.error(`[EmailConfig] SMTP Connection Error (${host}:${port}):`, error.message);
    return false;
  }
};
