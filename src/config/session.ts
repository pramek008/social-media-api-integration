// src/config/session.ts
import session from 'express-session';
import { Express } from 'express';

export const configureSession = (app: Express) => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      },
      // Force the session to be saved back to the store
      rolling: true,
      // Unset any existing sessions when creating a new one
      unset: 'destroy',
    }),
  );
};
