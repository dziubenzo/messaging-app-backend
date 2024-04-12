import User from '../models/User.js';

import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import {
  checkPasswordsEquality,
  checkUsernameAvailability,
} from '../config/middleware.js';
import { getFirstErrorMsg, getUserId } from '../config/helpers.js';

// GET all users
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const allUsers = await User.find({}).lean().exec();

  return res.json(allUsers);
});

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
