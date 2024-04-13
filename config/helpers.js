// Get error message of the first validation error
export const getFirstErrorMsg = (errors) => {
  return errors.array({ onlyFirstError: true })[0].msg;
};

// Generate a user id between 1000000 and 9999999, both inclusive
export const getUserId = () => {
  const min = Math.ceil(1000000);
  const max = Math.floor(9999999);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Modify req.user so that it does not include certain properties
export const modifyReqUser = (user) => {
  const safeUser = { ...user._doc };
  delete safeUser.password;
  delete safeUser._id;
  delete safeUser.__v;
  return safeUser;
};
