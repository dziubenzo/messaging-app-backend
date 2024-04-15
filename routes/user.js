import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  postCreateUser,
  postLoginUser,
  postCheckAuth,
  putAddContact,
  deleteRemoveContact,
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

// DELETE remove contact
router.delete('/:userId/remove-contact', deleteRemoveContact);

// POST login user
router.post('/login', postLoginUser);

// POST check auth
router.post('/auth', postCheckAuth);

export default router;
