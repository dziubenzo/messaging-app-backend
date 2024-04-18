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

    const [messagesSent, messagesReceived] = await Promise.all([
      Message.find({ sender: from, recipient: to }).lean().exec(),
      Message.find({ sender: to, recipient: from }).lean().exec(),
    ]);

    if (!messagesSent.length || !messagesReceived.length) {
      return res.json('No messages to show.');
    }

    return res.json('OK');
  }),
];
