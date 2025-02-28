import type { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { body, param, query, validationResult } from 'express-validator';
import slugify from 'slugify';
import { getFirstErrorMsg } from '../config/helpers';
import { checkNameAvailability } from '../config/middleware';
import GroupChat from '../models/GroupChat';

// @desc    Get all group chats
// @route   GET /group-chats
export const getGroupChats = [
  query('member').isMongoId().withMessage('Invalid query parameter'),

  asyncHandler(async (req: Request, res: Response) => {
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

// @desc    Get group chat
// @route   GET /group-chats/:groupChatSlug
export const getGroupChat = [
  param('groupChatSlug').isString().withMessage('Invalid group chat slug'),

  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const groupChatSlug = req.params.groupChatSlug;

    // Query group chat with members and messages from DB
    const groupChat = await GroupChat.findOne({
      slug: groupChatSlug,
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
        .json(`Failed to find group chat with slug ${groupChatSlug}`);
      return;
    }

    res.json(groupChat);
  }),
];

// @desc    Create group chat
// @route   POST /group-chats
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
    .withMessage('Select at least two contacts'),
  body('members.*').isMongoId().withMessage('Invalid user ID'),

  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      res.status(400).json(firstErrorMsg);
      return;
    }

    const name = req.body.name;
    const slug = slugify(name, { lower: true });
    const created_by = req.body.created_by;
    const members = req.body.members;

    const newGroupChat = new GroupChat({
      name,
      slug,
      created_by,
      members,
    });

    // Save new group chat to DB and return it with populated members field
    const newGroupChatPopulated = await (
      await newGroupChat.save()
    ).populate('members', 'username user_id');

    res.json(newGroupChatPopulated);
  }),
];

// @desc    Delete group chat
// @route   DELETE /group-chats/:groupChatId
export const deleteGroupChat = [
  param('groupChatId').isMongoId().withMessage('Invalid URL parameter'),

  asyncHandler(async (req: Request, res: Response) => {
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

// @desc    Create group chat message
// @route   POST /group-chats/:groupChatId/messages
export const postCreateGroupChatMessage = [
  param('groupChatId').isMongoId().withMessage('Invalid URL parameter'),
  body('sender')
    .isMongoId()
    .withMessage('Sender field must be a valid Mongo ID'),
  body('text')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be present and cannot exceed 5000 characters'),

  asyncHandler(async (req: Request, res: Response) => {
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
  }),
];
