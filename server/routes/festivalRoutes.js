import express from 'express';
import {
  createFestival,
  getFestivals,
  getFestivalById,
  updateFestival,
  updateFestivalStatus,
  deleteFestival,
  createFestivalUnified,
  updateFestivalUnified
} from '../controllers/festivalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getFestivals);
router.get('/:id', getFestivalById);

// Protected routes (Faculty/Admin)
router.post('/unified', protect, authorize('Faculty', 'Admin'), upload.single('banner'), createFestivalUnified);
router.put('/unified/:id', protect, authorize('Faculty', 'Admin'), upload.single('banner'), updateFestivalUnified);
router.post('/', protect, authorize('Faculty', 'Admin'), upload.single('banner'), createFestival);
router.put('/:id', protect, authorize('Faculty', 'Admin'), upload.single('banner'), updateFestival);
router.patch('/:id/status', protect, authorize('Faculty', 'Admin'), updateFestivalStatus);
router.delete('/:id', protect, authorize('Faculty', 'Admin'), deleteFestival);

export default router;
