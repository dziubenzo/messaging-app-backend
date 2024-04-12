import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  postCreateUser,
} from '../controllers/userController.js';

const router = Router();

// GET all users
router.get('/', getAllUsers);
// POST create user
router.post('/', postCreateUser);
// GET user
router.get('/:userId', getUser);

export default router;
