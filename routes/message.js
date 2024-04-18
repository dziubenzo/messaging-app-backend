import { Router } from 'express';
import { getMessages } from '../controllers/messageController.js';
import { isAuth } from '../config/passport.js';

const router = Router();

router.use(isAuth);

// GET messages user A <> user B
router.get('/', getMessages);

export default router;
