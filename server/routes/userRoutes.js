import express from 'express';
import { 
  createFaculty, 
  createStudent, 
  createAdmin, 
  manageUserStatus, 
  deleteUser, 
  updateUser,
  getUsersList, 
  searchUsers,
  getUserById,
  bulkUserActions,
  exportUsers
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes here require authentication
router.use(protect);

// Accessible to authenticated users (Faculty/Admin/Student) for dropdowns
router.get('/search', searchUsers);

// Restricted to Admin
router.use(authorize('Admin'));
router.get('/', getUsersList);
router.get('/export', exportUsers);
router.post('/bulk-action', bulkUserActions);
router.post('/faculty', createFaculty);
router.post('/student', createStudent);
router.post('/admin', createAdmin);
router.get('/:id', getUserById);
router.patch('/:id/status', manageUserStatus);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
