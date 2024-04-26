import express from 'express';
import 'dotenv/config.js';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import mongoose from 'mongoose';
import RateLimit from 'express-rate-limit';
import MongoStore from 'connect-mongo';

// Socket.IO imports
import { createServer } from 'http';
import { Server } from 'socket.io';

// Passport imports
import session from 'express-session';
import passport from 'passport';
import {
  localStrategy,
  serialiseFunction,
  deserialiseFunction,
} from './config/passport.js';

// Route imports
import indexRouter from './routes/index.js';
import userRouter from './routes/user.js';
import messageRouter from './routes/message.js';
import groupChatRouter from './routes/groupChat.js';

// CORS options - allowed site(s)
// No '/' at the end
const corsOptions = {
  origin: 'https://dziubenzo-messaging-app.netlify.app',
  credentials: true,
};

const app = express();

// Initialise both http and Socket.IO servers
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'https://dziubenzo-messaging-app.netlify.app' },
});

// Socket.IO event listeners and emitters
io.on('connection', (socket) => {
  // Send back what's been sent by the sender to every socket except for the sender
  socket.on('change status icon', (userId, imageURL) => {
    if (!userId || !imageURL) {
      return;
    }
    socket.broadcast.emit('update status icon', userId, imageURL);
  });

  socket.on('change username/text status', (userId, username, textStatus) => {
    socket.broadcast.emit(
      'update username/text status',
      userId,
      username,
      textStatus
    );
  });

  socket.on('send message', (fromId, toId, message, username) => {
    socket.broadcast.emit('receive message', fromId, toId, message);
    socket.broadcast.emit('show new message toast', toId, username);
  });

  socket.on('delete group chat', (groupChat) => {
    socket.broadcast.emit('remove group chat', groupChat);
  });

  socket.on('create group chat', (members, newGroupChat) => {
    socket.broadcast.emit('add group chat', members, newGroupChat);
  });

  socket.on('user is typing (DM)', (fromId, toId, username, isTyping) => {
    socket.broadcast.emit(
      'show/hide isTyping (DM)',
      fromId,
      toId,
      username,
      isTyping
    );
  });

  socket.on('user registers', (username) => {
    socket.broadcast.emit('show new user toast', username);
  });

  // Handle group chats
  socket.on('open group chat', (groupChatId) => {
    socket.join(groupChatId);
  });

  socket.on('send group chat message', (groupChatId, message) => {
    socket
      .to(groupChatId)
      .emit('receive group chat message', groupChatId, message);
  });

  socket.on(
    'user is typing (group chat)',
    (groupChatId, username, isTyping) => {
      socket.broadcast.emit(
        'show/hide isTyping (group chat)',
        groupChatId,
        username,
        isTyping
      );
    }
  );
});

app.use(cors(corsOptions));

// MongoDB connection
mongoose.set('strictQuery', false);

const mongoDB = process.env.MONGODB_URI;

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);
}

// Rate limiter: maximum of sixty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  validate: { xForwardedForHeader: false },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', 1);
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
      secure: true,
      sameSite: 'none',
    },
    store: MongoStore.create({ mongoUrl: mongoDB }),
  })
);
app.use(passport.session());
app.use(compression());
app.use(helmet());
app.use(limiter);

passport.use(localStrategy);
passport.serializeUser(serialiseFunction);
passport.deserializeUser(deserialiseFunction);

// Routes
app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/messages', messageRouter);
app.use('/group-chats', groupChatRouter);

// Error handler
app.use((err, req, res, next) => {
  return res.status(500).json({
    message: `ERROR: ${err.message}`,
  });
});

// Server listener
httpServer.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}...`);
});
