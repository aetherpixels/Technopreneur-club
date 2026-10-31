import express from 'express';
import { 
  downloadCertificate, 
  getMyCertificates, 
  getCertificateConfig, 
  upsertCertificateConfig, 
  getCertificatePreview 
} from '../controllers/certificateController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

// Student Endpoints
router.get('/', authorize('Student'), getMyCertificates);
router.get('/:eventId', authorize('Student'), downloadCertificate);

// Faculty & Admin Config Endpoints
router.get('/config/:eventId', authorize('Faculty', 'Admin'), getCertificateConfig);
router.post('/config', authorize('Faculty', 'Admin'), upload.fields([
  { name: 'logos', maxCount: 10 },
  { name: 'signatures', maxCount: 10 }
]), upsertCertificateConfig);
router.post('/preview', authorize('Faculty', 'Admin'), upload.fields([
  { name: 'logos', maxCount: 10 },
  { name: 'signatures', maxCount: 10 }
]), getCertificatePreview);

export default router;
