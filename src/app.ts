import compression from 'compression';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import 'dotenv/config.js';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import RateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import { isProduction } from './config/helpers.js';
import './config/mongoDB.js';
import { mongoDB } from './config/mongoDB.js';
import initialiseSocketIO from './config/socketIO.js';

// Passport imports
import session from 'express-session';
import passport from 'passport';
import {
  deserialiseFunction,
  localStrategy,
  serialiseFunction,
} from './config/passport.js';

// Route imports
import groupChatRouter from './routes/groupChat.js';
import indexRouter from './routes/index.js';
import messageRouter from './routes/message.js';
import userRouter from './routes/user.js';

// Frontend URL
export const FRONTEND_URL = isProduction()
  ? 'https://dziubenzo-messaging-app.netlify.app'
  : ['http://localhost:5173', 'http://192.168.0.13:5173'];

// CORS options - allowed site(s)
// No '/' at the end
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
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
// This ensures that the Set-Cookie header is sent and the cookie is set on the client after deployment
app.set('trust proxy', 1);
app.use(
  session({
    secret: process.env.SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
      secure: isProduction() ? true : false,
      sameSite: isProduction() ? 'none' : false,
    },
    store: MongoStore.create({ mongoUrl: mongoDB }),
  })
);
app.use(passport.session());
app.use(compression());
app.use(helmet());

if (isProduction()) app.use(limiter);

passport.use(localStrategy);
passport.serializeUser(serialiseFunction);
passport.deserializeUser(deserialiseFunction);

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
  httpServer.listen(parseInt(process.env.PORT!), '192.168.0.13', 511, () => {
    console.log(`Server listening on port ${process.env.PORT}...`);
  });
}
