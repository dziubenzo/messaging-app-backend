import type { NextFunction, Request, Response } from 'express';
import GroupChat from '../models/GroupChat';

import asyncHandler from 'express-async-handler';
import { body, param, query, validationResult } from 'express-validator';
import { getFirstErrorMsg } from '../config/helpers';
import { checkNameAvailability } from '../config/middleware';

// GET group chats
export const getGroupChats = [
  query('member').isMongoId().withMessage('Invalid query parameter'),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const memberID = req.query.member;

    const groupChats = await GroupChat.find({ members: memberID }, '-messages')
      .populate('members', 'username user_id')
      .lean()
      .exec();

    res.json(groupChats);
  }),
];

// GET group chat
export const getGroupChat = [
  param('groupChatName').isString().withMessage('Invalid group chat name'),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const groupChatName = req.params.groupChatName;

    // Query group chat with members and messages from DB
    const groupChat = await GroupChat.findOne({
      name: { $regex: groupChatName, $options: 'i' },
    })
      .populate([
        {
          path: 'members',
          select: ['user_id', 'username'],
        },
        {
          path: 'messages.sender',
          select: ['user_id', 'username'],
        },
      ])
      .lean()
      .exec();

    if (!groupChat) {
      res
        .status(400)
        .json(`Failed to find group chat with name ${groupChatName}`);
      return;
    }

    res.json(groupChat);
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

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const name = req.body.name;
    const created_by = req.body.created_by;
    const members = req.body.members;

    const newGroupChat = new GroupChat({
      name,
      created_by,
      members,
    });

    // Save new group chat to DB and return it with populated members field
    const newGroupChatPopulated = await (
      await newGroupChat.save()
    ).populate('members', 'username user_id');

    res.json(newGroupChatPopulated);
    return;
  }),
];

// DELETE group chat
export const deleteGroupChat = [
  param('groupChatId').isMongoId().withMessage('Invalid URL parameter'),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const groupChatId = req.params.groupChatId;

    const deletedGroupChat = await GroupChat.findByIdAndDelete(groupChatId);

    if (!deletedGroupChat) {
      res
        .status(400)
        .json(`Failed to delete group chat with id ${groupChatId}`);
      return;
    }

    res.json(`Group chat ${deletedGroupChat.name} deleted successfully!`);
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

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const groupChatId = req.params.groupChatId;
    const senderID = req.body.sender;
    const text = req.body.text;

    const newMessage = {
      sender: senderID,
      text: text,
      date: Date.now(),
    };

    // Add the message to the group chat messages array and return updated document
    const updatedGroupChat = await GroupChat.findByIdAndUpdate(
      groupChatId,
      {
        $push: {
          messages: newMessage,
        },
      },
      { new: true }
    ).populate('messages.sender', 'username');

    if (!updatedGroupChat) {
      res
        .status(400)
        .json(`Failed to add message to group chat with id ${groupChatId}`);
      return;
    }

    // Return added message
    res.json(updatedGroupChat.messages[updatedGroupChat.messages.length - 1]);
    return;
  }),
];
