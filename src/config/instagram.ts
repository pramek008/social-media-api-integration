// src/config/twitter.ts
import * as dotenv from 'dotenv';

dotenv.config();

export const instagramConfig = {
  clientId: process.env.INSTAGRAM_CLIENT_ID!,
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
  callbackURL: process.env.INSTAGRAM_CALLBACK_URL!,
};
