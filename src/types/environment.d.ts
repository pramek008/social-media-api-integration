// src/types/environment.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT: string;
      DB_HOST: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_NAME: string;
      TWITTER_CLIENT_ID: string;
      TWITTER_CLIENT_SECRET: string;
      TWITTER_CALLBACK_URL: string;
      JWT_SECRET: string;
      MAX_FILE_SIZE: string;
      UPLOAD_PATH: string;
    }
  }
}

export {};
