import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import festivalRoutes from './routes/festivalRoutes.js';

// Resolve ES6 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Connect to Database if in standard server mode
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().catch((err) => console.error("Initial DB connection failed:", err.message));
}

const app = express();

// Ensure DB connection for incoming requests (Serverless compatible)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows loading images from static folder
  crossOriginEmbedderPolicy: false, // Allows cross-origin iframe embedding
  frameguard: false,                // Disables X-Frame-Options SAMEORIGIN
  contentSecurityPolicy: false      // Disables CSP rule constraints locally
}));
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(normalizedOrigin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

import { verifyEmailConnection } from './config/emailConfig.js';
import sendEmail from './utils/sendEmail.js';

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Hooking
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/festivals', festivalRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/media', mediaRoutes);

// Test Email API Endpoint (POST /api/test-email)
app.post('/api/test-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a target email address in request body: { "email": "user@example.com" }',
    });
  }

  const result = await sendEmail({
    to: email,
    subject: 'Event-HuB SMTP Test Email Notification',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2563eb;">Event-HuB SMTP Connection Test</h2>
        <p>Congratulations!</p>
        <p>If you are reading this email, your localhost <strong>Nodemailer SMTP configuration</strong> is set up correctly and working!</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Event-HuB Institutional Event Management System</p>
      </div>
    `,
    text: 'Congratulations! Your localhost Event-HuB SMTP configuration is working.',
  });

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: `Test email delivered successfully to ${email}.`,
      messageId: result.messageId,
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Failed to deliver test email via SMTP.',
      errorCategory: result.errorCategory,
      error: result.error,
    });
  }
});

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Event Hub Server is running smoothly.' });
});

// Serve frontend static build in production if available
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (
      req.originalUrl.startsWith('/api') ||
      req.originalUrl.startsWith('/uploads') ||
      req.originalUrl.startsWith('/health')
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    await verifyEmailConnection();
  });
}

export default app;
