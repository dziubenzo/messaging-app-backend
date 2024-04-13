import User from '../models/User.js';

import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import {
  checkPasswordsEquality,
  checkUsernameAvailability,
} from '../config/middleware.js';
import { getFirstErrorMsg, getUserId } from '../config/helpers.js';
import { isAuth } from '../config/passport.js';

// GET all users
export const getAllUsers = [
  isAuth,
  asyncHandler(async (req, res, next) => {
    const allUsers = await User.find({}).lean().exec();

    return res.json(allUsers);
  }),
];

// POST create user
export const postCreateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage('Username must contain between 3 and 16 characters')
    .escape()
    .custom(checkUsernameAvailability)
    .withMessage('Username already taken'),
  body('password')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage('Password must contain between 3 and 16 characters')
    .escape(),
  body('confirm_password')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage(
      'Password confirmation must contain between 3 and 16 characters'
    )
    .escape()
    .custom(checkPasswordsEquality)
    .withMessage('Passwords do not match'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    const username = req.body.username;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check for password-hashing errors
    if (!hashedPassword) {
      return res
        .status(400)
        .json('Something went wrong while creating a user. Please try again.');
    }

    // Get all user ids from DB
    const userIds = await User.find({}, '-_id user_id').lean().exec();

    // Generate unique user id
    let userId;
    do {
      userId = getUserId();
    } while (userIds.includes(userId));

    // Create new user
    const newUser = new User({
      user_id: userId,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return res.json('User created successfully!');
  }),
];

// GET user
export const getUser = [
  isAuth,
  asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findOne({ user_id: userId }).lean().exec();

    if (!user) {
      return res.json('User not found');
    }

    return res.json(user);
  }),
];

// POST login user
export const postLoginUser = [
  passport.authenticate('local'),

  asyncHandler(async (req, res, next) => {
    return res.json(req.user.user_id);
  }),
];

// POST check auth
export const postCheckAuth = asyncHandler(async (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.json(req.user.user_id);
  } else {
    return res.status(401).json('You are not authenticated');
  }
});
