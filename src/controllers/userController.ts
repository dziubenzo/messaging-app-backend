import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { getFirstErrorMsg, getUserId } from '../config/helpers';
import {
  checkPasswordsEquality,
  checkUpdatedUsername,
  checkUsernameAvailability,
} from '../config/middleware';
import { checkAuth } from '../config/passport';
import GroupChat from '../models/GroupChat';
import User from '../models/User';

// GET all users
export const getAllUsers = [
  checkAuth,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const allUsers = await User.find({}, '-password -contacts').lean().exec();
    res.json(allUsers);
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

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const username = req.body.username;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check for password-hashing errors
    if (!hashedPassword) {
      res
        .status(400)
        .json('Something went wrong while creating a user. Please try again.');
      return;
    }

    // Get all user ids from DB as an array of objects and convert them to an array of numbers only
    const userIds = await User.find({}, '-_id user_id')
      .lean()
      .exec()
      .then((userIdsObjects) =>
        userIdsObjects.reduce((array: number[], userId) => {
          array.push(userId.user_id);
          return array;
        }, [])
      );

    // Generate unique user id
    let userId: number;
    do {
      userId = getUserId();
    } while (userIds.includes(userId));

    // Create new user
    const newUser = new User({
      user_id: userId,
      username,
      password: hashedPassword,
    });

    // Save user and add them to General group chat
    await Promise.all([
      newUser.save(),
      GroupChat.findOneAndUpdate(
        { name: 'General' },
        {
          $push: {
            members: newUser._id,
          },
        },
        { new: true }
      ),
    ]);

    res.json('User created successfully!');
  }),
];

// GET user
export const getUser = [
  checkAuth,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const user = await User.findOne({ user_id: userId }, '-id -password')
      .lean()
      .exec();

    if (!user) {
      res.json('User not found');
      return;
    }

    res.json(user);
  }),
];

// PUT add contact
export const putAddContact = [
  checkAuth,
  body('contact_id').isMongoId().withMessage('Invalid user ID'),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }
    const { userId } = req.params;
    const contactId = req.body.contact_id;

    // Add a contact to logged in user's contacts array
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      res.status(400).json(`Failed to retrieve user with id ${userId}`);
      return;
    }

    user.contacts.push(contactId);
    await user.save();

    // Get user from DB with populated contacts and without sensitive fields
    const updatedUser = await User.findOne(
      { user_id: userId },
      '-password'
    ).populate({ path: 'contacts', select: '-password' });

    // Return updated logged in user
    res.json(updatedUser);
  }),
];

// DELETE remove contact
export const deleteRemoveContact = [
  checkAuth,
  body('contact_id').isMongoId().withMessage('Invalid user id'),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }
    const { userId } = req.params;
    const contactId = req.body.contact_id;

    // Remove a contact from logged in user's contacts array
    await User.updateOne(
      { user_id: userId },
      { $pull: { contacts: contactId } }
    );

    // Get user from DB with populated contacts and without sensitive fields
    const updatedUser = await User.findOne(
      { user_id: userId },
      '-password'
    ).populate({ path: 'contacts', select: '-password' });

    // Return updated logged in user
    res.json(updatedUser);
  }),
];

// PUT change status icon
export const putChangeStatusIcon = [
  checkAuth,
  body('image_url').isURL().withMessage('Invalid image URL'),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
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
    res.json(updatedUser);
  }),
];

// PUT update user
export const putUpdateUser = [
  checkAuth,
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
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
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
    res.json(updatedUser);
  }),
];

// POST login user
export const postLoginUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage('Username must contain between 3 and 16 characters'),
  body('password').trim(),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const username = req.body.username;
    const password = req.body.password;

    // Get user from the DB
    const user = await User.findOne({ username }).exec();

    // Return error message if no user found
    if (!user) {
      res.status(401).json('Invalid username and/or password');
      return;
    }

    // Compare passwords
    const passwordsMatch = await bcrypt.compare(password, user.password);

    // Return error message if passwords do not match
    if (!passwordsMatch) {
      res.status(401).json('Invalid username and/or password');
      return;
    }

    // Create token valid for 3 days if login credentials are valid
    // Use user's ID as payload
    const options = { expiresIn: '3 days' };
    const token = jwt.sign({ id: user._id }, process.env.SECRET!, options);

    // Return token
    res.json(token);
  }),
];

// POST logout user
export const postLogoutUser = [
  checkAuth,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      return res.json('Logout successful');
    });
  }),
];

// POST check auth
export const postCheckAuth = [
  checkAuth,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.json(req.user);
  }),
];
