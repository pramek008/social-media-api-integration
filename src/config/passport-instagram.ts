import passport from 'passport';
import { Strategy } from 'passport-facebook';
import { instagramConfig } from './instagram';

export const configurePassportInstagram = () => {
  if (!process.env.INSTAGRAM_CLIENT_ID) {
    throw new Error('INSTAGRAM_CLIENT_ID is not defined');
  }
  if (!process.env.INSTAGRAM_CLIENT_SECRET) {
    throw new Error('INSTAGRAM_CLIENT_SECRET is not defined');
  }
  if (!process.env.INSTAGRAM_CALLBACK_URL) {
    throw new Error('INSTAGRAM_CALLBACK_URL is not defined');
  }

  passport.use(
    new Strategy(
      {
        authorizationURL: 'https://www.instagram.com/oauth/authorize',
        tokenURL: 'https://www.instagram.com/oauth/access_token',
        clientID: instagramConfig.clientId,
        clientSecret: instagramConfig.clientSecret,
        callbackURL: instagramConfig.callbackURL,
        passReqToCallback: true,
      },
      async (
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any,
      ) => {
        // Log semua data yang diterima (remove in production)
        console.log('Profile:', profile);
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        return done(null, { accessToken, profile });
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
};
