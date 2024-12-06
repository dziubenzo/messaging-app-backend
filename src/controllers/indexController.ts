import type { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

// @desc    Root path
// @route   ALL /
export const index = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    project: 'Talky-Talky!',
    author: 'dziubenzo',
  });
});
