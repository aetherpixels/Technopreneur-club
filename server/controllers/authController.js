import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { sendPasswordResetEmail } from '../services/emailService.js';
import fs from 'fs';
import path from 'path';

// JWT generator helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyeventhub123!', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Response helper setting HTTP-Only Cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      contactNumber: user.contactNumber,
      enrollmentNumber: user.enrollmentNumber,
      employeeId: user.employeeId,
      designation: user.designation,
      gender: user.gender,
      dob: user.dob,
      profilePhoto: user.profilePhoto,
    },
  });
};

// @desc    Register Student
// @route   POST /api/auth/register-student
// @access  Public
export const registerStudent = async (req, res, next) => {
  try {
    const { name, email, password, department, contactNumber, enrollmentNumber } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    if (enrollmentNumber) {
      const enrollmentExists = await User.findOne({ enrollmentNumber });
      if (enrollmentExists) {
        return res.status(409).json({ success: false, message: 'Enrollment number already registered' });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'Student',
      department,
      contactNumber,
      enrollmentNumber,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login User (Admin, Faculty, Student)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password presence
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify account status
    if (user.status === 'Blocked' || user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked or suspended.' });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Requests password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a registered email address.',
      });
    }

    // Always return the exact same success message to prevent user enumeration
    const uniformSuccessMessage = 'If an account exists with this email, a password reset link has been sent.';

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: uniformSuccessMessage,
      });
    }

    // Generate cryptographically secure random reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    // Hash token using SHA-256 and store in user document
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    user.resetToken = hashedResetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity
    await user.save({ validateBeforeSave: false });

    // Send email using Nodemailer utility
    await sendPasswordResetEmail(user.email, rawResetToken, user.name);

    res.status(200).json({
      success: true,
      message: uniformSuccessMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password - Updates password using valid token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, password } = req.body;
    const targetPassword = newPassword || password;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid password reset token.',
      });
    }

    if (!targetPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required.',
      });
    }

    if (targetPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Hash incoming raw token to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching unexpired token
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    // Update password (triggers pre-save bcrypt hook)
    user.password = targetPassword;

    // Clear reset token fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout User / Clear Cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role and status cannot be modified via self-service
    delete updates.role;
    delete updates.status;

    // Check unique email if modified
    if (updates.email && updates.email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: updates.email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use by another user' });
      }
      user.email = updates.email.toLowerCase().trim();
    }

    // Check unique enrollmentNumber if modified (for students)
    if (updates.enrollmentNumber && updates.enrollmentNumber.trim() !== user.enrollmentNumber) {
      const enrollExists = await User.findOne({ enrollmentNumber: updates.enrollmentNumber.trim() });
      if (enrollExists) {
        return res.status(400).json({ success: false, message: 'Enrollment number already in use' });
      }
      user.enrollmentNumber = updates.enrollmentNumber.trim();
    }

    // Password Update Logic
    if (updates.password && updates.password.trim()) {
      if (!updates.currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password' });
      }
      const isMatch = await user.matchPassword(updates.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      user.password = updates.password;
    }
    
    // Remove password keys from updates object so they don't overwrite hash logic
    delete updates.password;
    delete updates.currentPassword;

    // Apply allowed updates
    const allowedFields = ['name', 'firstName', 'lastName', 'department', 'contactNumber', 'gender', 'dob', 'designation', 'profilePhoto'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        contactNumber: user.contactNumber,
        enrollmentNumber: user.enrollmentNumber,
        employeeId: user.employeeId,
        designation: user.designation,
        gender: user.gender,
        dob: user.dob,
        profilePhoto: user.profilePhoto,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile Photo
// @route   PUT /api/auth/profile/photo
// @access  Private
export const updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      // Clean up uploaded file if user not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old profile photo if it exists
    if (user.profilePhoto) {
      const oldPath = path.join('.', user.profilePhoto);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (err) {
          console.warn('Failed to delete old profile photo:', err);
        }
      }
    }

    user.profilePhoto = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      profilePhoto: user.profilePhoto,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        contactNumber: user.contactNumber,
        enrollmentNumber: user.enrollmentNumber,
        employeeId: user.employeeId,
        profilePhoto: user.profilePhoto,
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};
