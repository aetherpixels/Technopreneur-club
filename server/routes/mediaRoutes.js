import express from 'express';
import { uploadMedia, uploadMultipleMedia, getEventMedia, getFestivalMedia, getAllMedia, deleteMedia, uploadRegistrationFile } from '../controllers/mediaController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public media querying
router.get('/all', getAllMedia);
router.get('/event/:eventId', getEventMedia);
router.get('/festival/:festivalId', getFestivalMedia);

// Upload and Delete routes (Protected)
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.post('/upload-registration-file', protect, upload.single('file'), uploadRegistrationFile);
router.post('/upload-multiple', protect, authorize('Faculty', 'Admin'), upload.array('files', 50), uploadMultipleMedia);
router.delete('/:id', protect, deleteMedia);

export default router;
