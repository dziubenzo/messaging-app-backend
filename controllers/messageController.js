import Message from '../models/Message.js';

import asyncHandler from 'express-async-handler';
import { body, query, validationResult } from 'express-validator';
import { getFirstErrorMsg } from '../config/helpers.js';

// GET messages user A <> user B
export const getMessages = [
  query('from').isMongoId().withMessage('Invalid query parameter (from)'),
  query('to').isMongoId().withMessage('Invalid query parameter (to)'),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first validation error message if there are any errors
      const firstErrorMsg = getFirstErrorMsg(errors);
      return res.status(400).json(firstErrorMsg);
    }

    const from = req.query.from;
    const to = req.query.to;

    // Get messages from user A to user B and from user B to user A
    const [messagesSent, messagesReceived] = await Promise.all([
      Message.find({ sender: from, recipient: to })
        .populate('sender', 'username')
        .lean()
        .exec(),
      Message.find({ sender: to, recipient: from })
        .populate('sender', 'username')
        .lean()
        .exec(),
    ]);

    // Combine messages and sort them in ascending order
    const messagesCombined = messagesSent
      .concat(messagesReceived)
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Return messages
    return res.json(messagesCombined);
  }),
];

// POST create message
export const postCreateMessage = [
  body('sender')
    .isMongoId()
    .withMessage('Sender field must be a valid Mongo ID'),
  body('recipient')
    .isMongoId()
    .withMessage('Recipient field must be a valid Mongo ID'),
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

    const sender = req.body.sender;
    const recipient = req.body.recipient;
    const text = req.body.text;

    // Create new message with current date
    const newMessage = new Message({
      sender,
      recipient,
      text,
      date: Date.now(),
    });

    // Save new message to DB and return it with populated sender field
    const newMessagePopulated = await (
      await newMessage.save()
    ).populate('sender', 'username');

    // Return new message
    return res.json(newMessagePopulated);
  }),
];
