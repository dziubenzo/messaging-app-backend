import { Router } from 'express';
import { checkAuth } from '../config/passport';
import {
  deleteGroupChat,
  getGroupChat,
  getGroupChats,
  postCreateGroupChat,
  postCreateGroupChatMessage,
} from '../controllers/groupChatController';

const router = Router();

router.use(checkAuth);

router.get('/', getGroupChats);

router.get('/:groupChatSlug', getGroupChat);

router.post('/', postCreateGroupChat);

router.delete('/:groupChatId', deleteGroupChat);

router.post('/:groupChatId/messages', postCreateGroupChatMessage);

export default router;
