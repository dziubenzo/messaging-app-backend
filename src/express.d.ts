// Provides types for req.user
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
