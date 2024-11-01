import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import type { ObjectId } from 'mongoose';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User';

// Local strategy
export const localStrategy = new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false);
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
);

// Serialise function
export const serialiseFunction = (
  user: Express.User,
  done: (err: any, id?: unknown) => void
) => {
  done(null, user.id);
};

// Deserialise function
export const deserialiseFunction = async (
  id: ObjectId,
  done: (err: any, user?: Express.User | false | null) => void
) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
};

// Check if user authenticated
export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json('You are not authorised to access this resource');
    return;
  }
};
