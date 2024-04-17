import User from '../models/User.js';

import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import {
  checkPasswordsEquality,
  checkUsernameAvailability,
  checkUpdatedUsername,
} from '../config/middleware.js';
import { getFirstErrorMsg, getUserId } from '../config/helpers.js';
import { isAuth } from '../config/passport.js';

// GET all users
export const getAllUsers = [
  isAuth,
  asyncHandler(async (req, res, next) => {
    const allUsers = await User.find({}, '-password -contacts').lean().exec();
    return res.json(allUsers);
  }),
];

// POST create user
export const postCreateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage('Username must contain between 3 and 16 characters')
    .custom(checkUsernameAvailability)
    .withMessage('Username already taken'),
  body('password')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage('Password must contain between 3 and 16 characters'),
  body('confirm_password')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage(
      'Password confirmation must contain between 3 and 16 characters'
    )
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
    const user = await User.findOne({ user_id: userId }, '-id -password')
      .lean()
      .exec();

    if (!user) {
      return res.json('User not found');
    }

    return res.json(user);
  }),
];

// PUT add contact
export const putAddContact = [
  isAuth,
  body('contact_id').isMongoId().withMessage('Invalid user id'),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }
    const { userId } = req.params;
    const contactId = req.body.contact_id;

    // Add a contact to logged in user's contacts array
    const user = await User.findOne({ user_id: userId });
    user.contacts.push(contactId);
    await user.save();

    // Get user from DB with populated contacts and without sensitive fields
    const updatedUser = await User.findOne(
      { user_id: userId },
      '-password'
    ).populate({ path: 'contacts', select: '-password' });

    // Return updated logged in user
    return res.json(updatedUser);
  }),
];

// DELETE remove contact
export const deleteRemoveContact = [
  isAuth,
  body('contact_id').isMongoId().withMessage('Invalid user id'),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }
    const { userId } = req.params;
    const contactId = req.body.contact_id;

    // Remove a contact from logged in user's contacts array
    const user = await User.findOne({ user_id: userId });
    user.contacts.pull(contactId);
    await user.save();

    // Get user from DB with populated contacts and without sensitive fields
    const updatedUser = await User.findOne(
      { user_id: userId },
      '-password'
    ).populate({ path: 'contacts', select: '-password' });

    // Return updated logged in user
    return res.json(updatedUser);
  }),
];

// PUT change status icon
export const putChangeStatusIcon = [
  isAuth,
  body('image_url').isURL().withMessage('Invalid image URL'),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    // Update logged in user's status_icon field
    const { userId } = req.params;
    const imageURL = req.body.image_url;

    await User.findOneAndUpdate({ user_id: userId }, { status_icon: imageURL });

    // Get user from DB with populated contacts and without sensitive fields
    const updatedUser = await User.findOne(
      { user_id: userId },
      '-password'
    ).populate({ path: 'contacts', select: '-password' });

    // Return updated logged in user
    return res.json(updatedUser);
  }),
];

// PUT update user
export const putUpdateUser = [
  isAuth,
  body('username')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage('Username must contain between 3 and 16 characters')
    .custom(checkUpdatedUsername)
    .withMessage('Username already taken'),
  body('status_text')
    .trim()
    .isLength({ max: 70 })
    .withMessage('Status cannot exceed 70 characters'),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    // Update logged in user's username and status_text fields
    const { userId } = req.params;
    const username = req.body.username;
    const statusText = req.body.status_text;

    await User.findOneAndUpdate(
      { user_id: userId },
      { username, status_text: statusText }
    );

    // Get user from DB with populated contacts and without sensitive fields
    const updatedUser = await User.findOne(
      { user_id: userId },
      '-password'
    ).populate({ path: 'contacts', select: '-password' });

    // Return updated logged in user
    return res.json(updatedUser);
  }),
];

// POST login user
export const postLoginUser = [
  passport.authenticate('local'),

  asyncHandler(async (req, res, next) => {
    // Get logged in user from DB with populated contacts
    // Populate() method does not work in Local Strategy, meaning req.user does not contain contacts data, so I need to query DB again
    const loggedInUser = await User.findOne(
      { username: req.user.username },
      '-password'
    ).populate({ path: 'contacts', select: '-password' });
    return res.json(loggedInUser);
  }),
];

// POST logout user
export const postLogoutUser = [
  isAuth,
  asyncHandler(async (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      return res.json('Logout successful');
    });
  }),
];

// POST check auth
export const postCheckAuth = asyncHandler(async (req, res, next) => {
  if (req.isAuthenticated()) {
    const loggedInUser = await User.findOne(
      { username: req.user.username },
      '-password'
    ).populate({ path: 'contacts', select: '-password' });
    return res.json(loggedInUser);
  } else {
    return res.status(401).json('You are not authenticated');
  }
});
