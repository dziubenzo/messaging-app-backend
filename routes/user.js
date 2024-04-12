import { Router } from 'express';
import { getAllUsers } from '../controllers/userController.js';

const router = Router();

// GET all users
router.get('/', getAllUsers);

export default router;
