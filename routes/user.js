import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  postCreateUser,
  postLoginUser,
  postCheckAuth,
  putAddContact,
} from '../controllers/userController.js';

const router = Router();

// GET all users
router.get('/', getAllUsers);

// POST create user
router.post('/', postCreateUser);

// GET user
router.get('/:userId', getUser);

// PUT add contact
router.put('/:userId/add-contact', putAddContact);

// POST login user
router.post('/login', postLoginUser);

// POST check auth
router.post('/auth', postCheckAuth);

export default router;
