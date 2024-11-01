import { Router } from 'express';
import {
  deleteRemoveContact,
  getAllUsers,
  getUser,
  postCheckAuth,
  postCreateUser,
  postLoginUser,
  postLogoutUser,
  putAddContact,
  putChangeStatusIcon,
  putUpdateUser,
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

// PUT change status icon
router.put('/:userId/change-status-icon', putChangeStatusIcon);

// PUT update user
router.put('/:userId/update', putUpdateUser);

// POST login user
router.post('/login', postLoginUser);

// POST logout user
router.post('/logout', postLogoutUser);

// POST check auth
router.post('/auth', postCheckAuth);

export default router;
