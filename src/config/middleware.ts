import type { Meta } from 'express-validator';
import GroupChat from '../models/GroupChat';
import User from '../models/User';

// Check if the username provided is available (case-insensitive)
export const checkUsernameAvailability = async (value: string) => {
  const usernameTaken = await User.exists({
    username: { $regex: new RegExp(`^${value}$`), $options: 'i' },
  })
    .lean()
    .exec();
  if (usernameTaken) {
    return Promise.reject();
  }
  return Promise.resolve();
};

// Check username to be updated for availability
// Pass through the case when username is equal to user's current username but might differ in case
export const checkUpdatedUsername = async (value: string, meta: Meta) => {
  const req = meta.req;
  const user = await User.findOne(
    {
      username: { $regex: new RegExp(`^${value}$`), $options: 'i' },
    },
    'username'
  )
    .lean()
    .exec();
  if (
    !user ||
    user.username.toLowerCase() === req.body.current_username.toLowerCase()
  ) {
    return Promise.resolve();
  }
  return Promise.reject();
};

// Check if passwords match
export const checkPasswordsEquality = (value: string, meta: Meta) => {
  const req = meta.req;
  return value === req.body.password;
};

// Check if the group chat name provided is available (case-insensitive)
export const checkNameAvailability = async (value: string) => {
  const nameTaken = await GroupChat.exists({
    name: { $regex: new RegExp(`^${value}$`), $options: 'i' },
  })
    .lean()
    .exec();
  if (nameTaken) {
    return Promise.reject();
  }
  return Promise.resolve();
};
