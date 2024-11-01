import { Router } from 'express';
import { isAuth } from '../config/passport.js';
import {
  getMessages,
  postCreateMessage,
} from '../controllers/messageController.js';

const router = Router();

router.use(isAuth);

// GET messages user A <> user B
router.get('/', getMessages);

// POST create message
router.post('/', postCreateMessage);

export default router;
