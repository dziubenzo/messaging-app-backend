import express from 'express';
import 'dotenv/config.js';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import mongoose from 'mongoose';
import RateLimit from 'express-rate-limit';
import MongoStore from 'connect-mongo';

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

// CORS options - allowed site(s)
// No '/' at the end
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));

// MongoDB connection
mongoose.set('strictQuery', false);

const mongoDB = process.env.MONGODB_URI;

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);
}

// Rate limiter: maximum of forty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 40,
  validate: { xForwardedForHeader: false },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
    },
    store: MongoStore.create({ mongoUrl: mongoDB }),
  })
);
app.use(passport.session());
app.use(compression());
app.use(helmet());
/* 
ENABLE LATER
*/
// app.use(limiter);

passport.use(localStrategy);
passport.serializeUser(serialiseFunction);
passport.deserializeUser(deserialiseFunction);

// Routes
app.use('/', indexRouter);
app.use('/users', userRouter);

// Error handler
app.use((err, req, res, next) => {
  return res.status(500).json({
    message: `ERROR: ${err.message}`,
  });
});

// Server listener
app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}...`);
});
