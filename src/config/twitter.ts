// src/config/twitter.ts
import * as dotenv from "dotenv";

dotenv.config();

export const twitterConfig = {
  consumerKey: process.env.TWITTER_CONSUMER_KEY!,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
  callbackUrl: process.env.TWITTER_CALLBACK_URL!,
};
