import express from 'express';
import { registerStudent, loginUser, forgotPassword, resetPassword, logoutUser, updateProfile, updateProfilePhoto } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register-student', registerStudent);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logoutUser);

// Get current logged-in user profile
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

// Update profile details and profile picture
router.put('/profile', protect, updateProfile);
router.put('/profile/photo', protect, upload.single('profilePhoto'), updateProfilePhoto);

export default router;
