// src/types/index.ts
export interface UserCredentialAttributes {
  id?: number;
  twitterId: string;
  displayName: string;
  twitterAccessToken: string;
  twitterAccessSecret: string;
  username: string;
  profileImageUrl: string;
  email: string;
  location: string;
  description: string;
  followersCount: number;
  friendsCount: number;
}

export interface ScheduledTweetAttributes {
  id?: number;
  userId: number;
  content: string;
  mediaUrls: string;
  scheduledTime: Date;
  status: 'pending' | 'published' | 'failed';
  error?: string;
}

export interface SuccessPublishedTweetAttributes {
  id?: number;
  tweetId: string;
  tweetTextPayload: string;
  tweetMediaPayload: string;
  tweetUrl: string;
  userCredentialsId: number;
  scheduledTweetId: number;
}

export interface UserCredentialInstagramAttributes {
  id?: number;
  instagramUserId: string; // ID unik pengguna Instagram
  username: string; // Username Instagram
  displayName: string; // Nama tampilan pengguna
  accessToken: string; // Long-lived access token
  tokenExpiresIn: Date; // Masa berlaku token (dalam detik)
  profilePictureUrl: string; // URL foto profil
  followersCount: number; // Jumlah followers
  followsCount: number; // Jumlah followings
  mediaCount: number; // Jumlah media (post)
}

export interface ScheduledPostInstagramAttributes {
  id?: number | undefined;
  userId: number; // ID user yang membuat post
  caption: string; // Caption untuk post
  mediaUrls: string; // JSON string array of media URLs
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS'; // Jenis media
  scheduledTime: Date; // Waktu penjadwalan post
  containerId?: string; // ID container yang dibuat di Instagram
  instagramMediaId?: string; // ID media yang dipublikasikan di Instagram
  postUrl?: string;
  containerCaraouselId?: string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED' | 'DRAFT'; // Status post
  retryCount: number; // Jumlah percobaan retry
  error?: string | undefined; // Pesan error jika gagal
  publishedAt?: Date; // Waktu post berhasil dipublikasikan
}

// export interface SuccessPublishedPostInstagramAttributes {
//   id?: number;
//   postId: string;
//   captionPayload: string;
//   postMediaPayload: string;
//   postUrl: string;
//   userCredentialsId: number;
//   scheduledPostId: number;
// }

export interface Config {
  database: {
    database: string;
    username: string;
    password: string;
    host: string;
    dialect: 'mysql';
    pool: {
      max: number;
      min: number;
      acquire: number;
      idle: number;
    };
    logging: boolean | ((msg: string) => void);
  };
  twitter: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
}

// // src/types/index.ts
// export interface User {
//   id: number;
//   twitter_id: string;
//   access_token: string;
//   refresh_token: string;
//   username: string;
//   created_at: Date;
//   updated_at: Date;
// }

// export interface Tweet {
//   id: number;
//   user_id: number;
//   content: string;
//   scheduled_for: Date;
//   status: 'pending' | 'posted' | 'failed';
//   created_at: Date;
//   updated_at: Date;
// }

// export interface TweetMedia {
//   id: number;
//   tweet_id: number;
//   media_path: string;
//   created_at: Date;
// }
