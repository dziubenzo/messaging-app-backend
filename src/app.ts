import compression from 'compression';
import cors from 'cors';
import 'dotenv/config.js';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import RateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import passport from 'passport';
import { isProduction } from './config/helpers';
import './config/mongoDB';
import { jwtStrategy } from './config/passport';
import initialiseSocketIO from './config/socketIO';

// Route imports
import groupChatRouter from './routes/groupChat';
import indexRouter from './routes/index';
import messageRouter from './routes/message';
import userRouter from './routes/user';

// Frontend URL
export const FRONTEND_URL = isProduction()
  ? 'https://dziubenzo-messaging-app.netlify.app'
  : ['http://localhost:5173', 'http://192.168.0.13:5173'];

// CORS options - allowed site(s)
// No '/' at the end
const corsOptions = {
  origin: FRONTEND_URL,
};

// Rate limiter: maximum of sixty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  validate: { xForwardedForHeader: false },
});

const app = express();

// Initialise both http and Socket.IO servers
const httpServer = createServer(app);
initialiseSocketIO(httpServer, FRONTEND_URL);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());
app.use(helmet());

if (isProduction()) app.use(limiter);

// JWT authentication
passport.use(jwtStrategy);

// Routes
app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/messages', messageRouter);
app.use('/group-chats', groupChatRouter);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    message: `ERROR: ${err.message}`,
  });
  return;
});

// Server listener
if (isProduction()) {
  httpServer.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}...`);
  });
} else {
  httpServer.listen(parseInt(process.env.PORT!), '192.168.0.13', () => {
    console.log(`Server listening on port ${process.env.PORT}...`);
  });
}
