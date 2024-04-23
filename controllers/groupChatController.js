import GroupChat from '../models/GroupChat.js';

import asyncHandler from 'express-async-handler';
import { body, param, query, validationResult } from 'express-validator';
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
  body('created_by').isMongoId().withMessage('Invalid user ID'),
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
    const created_by = req.body.created_by;
    const members = req.body.members;

    const newGroupChat = new GroupChat({
      name,
      created_by,
      members,
    });

    await newGroupChat.save();

    return res.json('Group chat created successfully!');
  }),
];

// DELETE group chat
export const deleteGroupChat = [
  param('groupChatId').isMongoId().withMessage('Invalid URL parameter'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    const groupChatId = req.params.groupChatId;

    const { name } = await GroupChat.findByIdAndDelete(groupChatId);

    return res.json(`Group chat ${name} deleted successfully!`);
  }),
];

// GET group chat messages
export const getGroupChatMessages = [
  param('groupChatId').isMongoId().withMessage('Invalid URL parameter'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    const groupChatID = req.params.groupChatId;

    const { messages } = await GroupChat.findOne(
      { _id: groupChatID },
      '-_id messages'
    )
      .populate('messages.sender', 'username user_id')
      .lean()
      .exec();

    return res.json(messages);
  }),
];

// POST create group chat message
export const postCreateGroupChatMessage = [
  param('groupChatId').isMongoId().withMessage('Invalid URL parameter'),
  body('sender')
    .isMongoId()
    .withMessage('Sender field must be a valid Mongo ID'),
  body('text')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be present and cannot exceed 5000 characters'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    const groupChatID = req.params.groupChatId;
    const senderID = req.body.sender;
    const text = req.body.text;

    const newMessage = {
      sender: senderID,
      text: text,
      date: Date.now(),
    };

    // Add the message to the group chat messages array and return updated document
    const updatedGroupChat = await GroupChat.findByIdAndUpdate(
      groupChatID,
      {
        $push: {
          messages: newMessage,
        },
      },
      { new: true, upsert: true }
    ).populate('messages.sender', 'username');

    // Return added message
    return res.json(
      updatedGroupChat.messages[updatedGroupChat.messages.length - 1]
    );
  }),
];
