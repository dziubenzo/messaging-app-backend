import { Router } from 'express';
import {
  getGroupChats,
  postCreateGroupChat,
  deleteGroupChat,
} from '../controllers/groupChatController.js';
import { isAuth } from '../config/passport.js';

const router = Router();

router.use(isAuth);

// GET group chats
router.get('/', getGroupChats);

// POST create group chat
router.post('/', postCreateGroupChat);

// DELETE group chat
router.delete('/:groupChatId', deleteGroupChat);

export default router;
