import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  postCreateUser,
  postLoginUser,
} from '../controllers/userController.js';

const router = Router();

// GET all users
router.get('/', getAllUsers);

// POST create user
router.post('/', postCreateUser);

// GET user
router.get('/:userId', getUser);

// POST login user
router.post('/login', postLoginUser);

export default router;
