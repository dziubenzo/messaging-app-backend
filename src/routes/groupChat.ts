import { Router } from 'express';
import { isAuth } from '../config/passport';
import {
  deleteGroupChat,
  getGroupChat,
  getGroupChatMessages,
  getGroupChats,
  postCreateGroupChat,
  postCreateGroupChatMessage,
} from '../controllers/groupChatController';

const router = Router();

router.use(isAuth);

// GET group chats
router.get('/', getGroupChats);

// GET group chat
router.get('/:groupChatName', getGroupChat);

// POST create group chat
router.post('/', postCreateGroupChat);

// DELETE group chat
router.delete('/:groupChatId', deleteGroupChat);

// POST create group chat message
router.post('/:groupChatId/messages', postCreateGroupChatMessage);

export default router;
