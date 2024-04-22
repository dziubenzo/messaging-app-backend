import GroupChat from '../models/GroupChat.js';

import asyncHandler from 'express-async-handler';
import { body, query, validationResult } from 'express-validator';
import { getFirstErrorMsg } from '../config/helpers.js';
import { checkNameAvailability } from '../config/middleware.js';

// GET group chats
export const getGroupChats = [
  query('member').isMongoId().withMessage('Invalid query parameter'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    const memberID = req.query.member;

    const groupChats = await GroupChat.find({ members: memberID }, '-messages')
      .populate('members', 'username user_id')
      .lean()
      .exec();

    return res.json(groupChats);
  }),
];

// POST create group chat
export const postCreateGroupChat = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 32 })
    .withMessage('Name must contain between 3 and 32 characters')
    .custom(checkNameAvailability)
    .withMessage('Group chat name already taken'),
  body('members')
    .isArray({ min: 3 })
    .withMessage('Members must be an array of at least 3 elements'),
  body('members.*').isMongoId().withMessage('Invalid user ID'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    const name = req.body.name;
    const members = req.body.members;

    const newGroupChat = new GroupChat({
      name,
      members,
    });

    await newGroupChat.save();

    return res.json('Group chat created successfully!');
  }),
];