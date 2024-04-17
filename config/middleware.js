import User from '../models/User.js';

// Check if the username provided is available
// Treat dziubenzo and Dziubenzo as the same
export const checkUsernameAvailability = async (value) => {
  const usernameTaken = await User.exists({
    username: { $regex: value, $options: 'i' },
  })
    .lean()
    .exec();
  if (usernameTaken) {
    return Promise.reject();
  }
  return Promise.resolve();
};

// Check username to be updated for availability
// Pass through the case when username is equal to user's current username
export const checkUpdatedUsername = async (value, { req }) => {
  const { username } = await User.findOne(
    {
      username: { $regex: value, $options: 'i' },
    },
    'username'
  )
    .lean()
    .exec();
  if (
    username &&
    username.toLowerCase() !== req.body.current_username.toLowerCase()
  ) {
    return Promise.reject();
  }
  return Promise.resolve();
};

// Check if passwords match
export const checkPasswordsEquality = (value, { req }) => {
  return value === req.body.password;
};
