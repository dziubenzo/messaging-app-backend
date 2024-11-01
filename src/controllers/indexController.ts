import type { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const index = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.json({
      project: 'Messaging App',
      author: 'dziubenzo',
    });
  }
);
