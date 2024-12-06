import { Router } from 'express';
import { checkAuth } from '../config/passport';
import {
  getMessages,
  postCreateMessage,
} from '../controllers/messageController';

const router = Router();

router.use(checkAuth);

router.get('/', getMessages);

router.post('/', postCreateMessage);

export default router;
