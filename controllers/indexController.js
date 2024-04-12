import asyncHandler from 'express-async-handler';

export const index = asyncHandler(async (req, res, next) => {
  return res.json({
    project: 'Messaging App',
    author: 'dziubenzo',
  });
});
