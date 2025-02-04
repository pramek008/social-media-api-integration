import express from 'express';
import { Request, Response } from 'express';
import axios from 'axios';
import { instagramConfig } from '../config/instagram';
import { UserCredentialInstagramAttributes } from '../types';
import { encrypt } from '../utils/encryption';
import { UserCredentialInstagram } from '../models/UserCredentialInstagram';

const router = express.Router();

const logSession = (req: Request, res: Response, next: () => void) => {
  console.log('Session:', req.session);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
};

router.use(logSession);

// Langkah 1: Redirect ke Instagram untuk authorization code
router.get('/instagram', (req, res) => {
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${instagramConfig.clientId}&redirect_uri=${instagramConfig.callbackURL}&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_content_publish,instagram_business_manage_comments&response_type=code`;
  res.redirect(authUrl);
});

// Langkah 2: Menukar authorization code dengan short-lived access token
router.get('/instagram/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    // Dapatkan short-lived access token
    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      `client_id=${instagramConfig.clientId}&client_secret=${instagramConfig.clientSecret}&grant_type=authorization_code&redirect_uri=${instagramConfig.callbackURL}&code=${code}`,
    );
    // console.log('Token Response:', tokenResponse.data);
    const shortLivedToken = tokenResponse.data.access_token;

    // Langkah 3: Menukar short-lived token dengan long-lived token
    const longLivedTokenResponse = await axios.get(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${instagramConfig.clientSecret}&access_token=${shortLivedToken}`,
    );
    // console.log('Long-lived Token Response:', longLivedTokenResponse.data);
    const longLivedToken = longLivedTokenResponse.data.access_token;

    const tokenExpiresInSeconds = longLivedTokenResponse.data.expires_in;
    const tokenExpiresInDate = new Date(
      Date.now() + tokenExpiresInSeconds * 1000, // convert to milliseconds
    );

    const encryptedLongLiveToken = encrypt(longLivedToken);

    // Langkah 4: Mengambil data profil pengguna
    const profileResponse = await axios.get(
      `https://graph.instagram.com/me?fields=id,user_id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${longLivedToken}`,
    );
    console.log('Profile Response:', profileResponse.data);
    const profileData = profileResponse.data;

    // Langkah 5: Simpan long-lived token dan data profil ke database
    const userData: UserCredentialInstagramAttributes = {
      instagramUserId: profileData.id,
      username: profileData.username,
      displayName: profileData.name,
      accessToken: encryptedLongLiveToken,
      tokenExpiresIn: tokenExpiresInDate,
      profilePictureUrl: profileData.profile_picture_url,
      followersCount: profileData.followers_count,
      followsCount: profileData.follows_count,
      mediaCount: profileData.media_count,
    };

    let user = await UserCredentialInstagram.findOne({
      where: { instagramUserId: profileData.id },
    });
    if (!user) {
      user = await UserCredentialInstagram.create(userData);
    } else {
      await user.update(userData);
    }

    // res.json({
    //   encryptedLongLiveToken,
    //   profileData,
    // });
    res.redirect('/instagram/success');
  } catch (error) {
    console.error(
      'Error during Instagram OAuth flow:',
      (error as any).response
        ? (error as any).response.data
        : (error as any).message,
    );
    res.status(500).send('Error during Instagram OAuth flow');
  }
});

router.get('/instagram/logout', (req, res) => {
  // Clear all possible cookies
  const cookies = req.cookies;
  for (let cookie in cookies) {
    res.clearCookie(cookie, {
      path: '/',
      domain: req.hostname,
    });
  }

  res.redirect('/');
});

router.get('/instagram/success', (req, res) => {
  res.json({
    success: true,
    message: 'Success',
    data: req.user,
  });
});

router.get('/instagram/error', (req, res) => {
  res.redirect('/');
});

// router.get('')

export default router;
