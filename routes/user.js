import { Router } from 'express';
import { getAllUsers, postCreateUser } from '../controllers/userController.js';

const router = Router();

// GET all users
router.get('/', getAllUsers);
// POST create user
router.post('/', postCreateUser);

export default router;
