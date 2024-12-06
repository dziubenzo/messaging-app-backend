import { Router } from 'express';
import { index } from '../controllers/indexController';

const router = Router();

router.all('/', index);

export default router;
