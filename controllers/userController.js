import User from '../models/User.js';

import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

// GET all users
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const allUsers = await User.find({}).lean().exec();

  return res.json(allUsers);
});
