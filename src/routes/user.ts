import { Router } from 'express';
import {
  deleteRemoveContact,
  getAllUsers,
  getUser,
  postCheckAuth,
  postCreateUser,
  postLoginUser,
  putAddContact,
  putChangeStatusIcon,
  putUpdateUser
} from '../controllers/userController';

const router = Router();

router.get('/', getAllUsers);

router.post('/', postCreateUser);

router.get('/:userId', getUser);

router.put('/:userId/add-contact', putAddContact);

router.delete('/:userId/remove-contact', deleteRemoveContact);

router.put('/:userId/change-status-icon', putChangeStatusIcon);

router.put('/:userId/update', putUpdateUser);

router.post('/login', postLoginUser);

router.post('/auth', postCheckAuth);

export default router;
