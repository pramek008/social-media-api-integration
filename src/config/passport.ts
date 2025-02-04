// src/config/passport.ts
import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { UserCredential } from '../models';
import { twitterConfig } from './twitter';
import { encrypt, decrypt } from '../utils/encryption';

export const configurePassport = () => {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await UserCredential.findByPk(id);
      if (user) {
        // Decrypt sensitive data when retrieving user
        user.twitterAccessToken = decrypt(user.twitterAccessToken);
        user.twitterAccessSecret = decrypt(user.twitterAccessSecret);
      }
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  });

  passport.use(
    new TwitterStrategy(
      {
        consumerKey: twitterConfig.consumerKey,
        consumerSecret: twitterConfig.consumerSecret,
        callbackURL: twitterConfig.callbackUrl,
        includeEmail: true,
      },
      async (token: string, tokenSecret: string, profile: any, done: any) => {
        try {
          // Log semua data yang diterima (remove in production)
          console.log('=== Twitter Authentication Data ===');
          console.log('Profile:', JSON.stringify(profile, null, 2));

          // Encrypt sensitive data before saving
          const encryptedToken = encrypt(token);
          const encryptedTokenSecret = encrypt(tokenSecret);

          // Data yang bisa kita dapatkan dari profile Twitter:
          const userData = {
            twitterId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            twitterAccessToken: encryptedToken,
            twitterAccessSecret: encryptedTokenSecret,
            profileImageUrl: profile.photos?.[0]?.value || null,
            email: profile.emails?.[0]?.value || null,
            location: profile._json?.location || null,
            description: profile._json?.description || null,
            followersCount: profile._json?.followers_count || 0,
            friendsCount: profile._json?.friends_count || 0,
          };

          console.log('=== UserCredential Data ===');
          console.log('UserCredential:', JSON.stringify(userData, null, 2));

          // Cari atau buat user
          let user = await UserCredential.findOne({
            where: { twitterId: profile.id },
          });

          if (user) {
            // Update user yang sudah ada
            console.log('Updating existing user');
            await user.update({
              twitterAccessToken: encryptedToken,
              twitterAccessSecret: encryptedTokenSecret,
              username: profile.username,
              displayName: profile.displayName,
              profileImageUrl: userData.profileImageUrl,
            });
          } else {
            // Buat user baru
            console.log('Creating new user');
            user = await UserCredential.create(userData);
          }

          // Decrypt tokens before returning user object
          user.twitterAccessToken = token;
          user.twitterAccessSecret = tokenSecret;

          return done(null, user);
        } catch (error) {
          console.error('Error in Twitter Strategy:', error);
          return done(error, null);
        }
      },
    ),
  );
};
