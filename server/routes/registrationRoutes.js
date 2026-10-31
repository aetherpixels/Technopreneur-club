import express from 'express';
import { registerForEvent, cancelRegistration, getRegisteredEvents, getEventRegistrations, markAttendance, exportRegistrations } from '../controllers/registrationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// Student registration paths
router.post('/', authorize('Student'), registerForEvent);
router.post('/:id/cancel', authorize('Student'), cancelRegistration);
router.get('/my-registrations', authorize('Student'), getRegisteredEvents);

// Faculty attendance and monitoring paths
router.get('/event/:eventId', authorize('Faculty', 'Admin'), getEventRegistrations);
router.get('/event/:eventId/export', authorize('Faculty', 'Admin'), exportRegistrations);
router.post('/attendance/:eventId', authorize('Faculty', 'Admin'), markAttendance);

export default router;
