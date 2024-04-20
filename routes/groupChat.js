import { Router } from 'express';
import {
  getGroupChats,
  postCreateGroupChat,
} from '../controllers/groupChatController.js';
import { isAuth } from '../config/passport.js';

const router = Router();

router.use(isAuth);

// GET group chats
router.get('/', getGroupChats);

// POST create group chat
router.post('/', postCreateGroupChat);

export default router;
