import { Router } from 'express';
import {
  getGroupChats,
  postCreateGroupChat,
  deleteGroupChat,
  getGroupChatMessages,
  postCreateGroupChatMessage,
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

// GET group chat messages
router.get('/:groupChatId/messages', getGroupChatMessages);

// POST create group chat message
router.post('/:groupChatId/messages', postCreateGroupChatMessage);

export default router;
