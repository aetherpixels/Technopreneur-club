import express from 'express';
import { createEvent, editEvent, updateEventStatus, getEvents, getEventById, getFacultyEvents, duplicateEvent, deleteEvent } from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/my-events', protect, authorize('Faculty'), getFacultyEvents);
router.get('/:id', getEventById);

// Restricted routes (Faculty/Admin)
router.post('/', protect, authorize('Faculty', 'Admin'), upload.single('poster'), createEvent);
router.put('/:id', protect, authorize('Faculty', 'Admin'), upload.single('poster'), editEvent);
router.post('/:id/duplicate', protect, authorize('Faculty', 'Admin'), duplicateEvent);
router.patch('/:id/status', protect, authorize('Faculty', 'Admin'), updateEventStatus);
router.delete('/:id', protect, authorize('Faculty', 'Admin'), deleteEvent);

export default router;
