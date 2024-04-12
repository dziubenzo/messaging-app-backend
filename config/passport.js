import LocalStrategy from 'passport-local';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

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
export const serialiseFunction = (user, done) => {
  done(null, user.id);
};

// Deserialise function
export const deserialiseFunction = async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
};

// Check if user authenticated
export const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.status(401).json('You are not authorised to access this resource');
  }
};
