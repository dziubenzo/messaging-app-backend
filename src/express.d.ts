// Provides types for req.user and for Passport serialize/deserialize functions
// User interface is empty by default

declare global {
  namespace Express {
    interface User {
      username: string;
      id?: ObjectId;
    }
  }
}

export {};
