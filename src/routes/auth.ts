// src/routes/auth.ts
import express from 'express';
import { Request, Response } from 'express';
import passport from 'passport';

const router = express.Router();

// Tambahkan middleware untuk logging session
const logSession = (req: any, res: any, next: any) => {
  console.log('Current Session:', req.session);
  next();
};

// Gunakan session logging di semua routes
router.use(logSession);

router.get(
  '/twitter',
  (req, res, next) => {
    // Pastikan session tersimpan sebelum redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/auth/twitter/error');
      } else {
        next();
      }
    });
  },
  passport.authenticate('twitter', {
    successRedirect: '/api/auth/twitter/callback',
    failureRedirect: '/api/auth/twitter/error',
    failureFlash: true,
    failureMessage: true,
  }),
);

router.get(
  '/twitter/callback',
  (req: Request, res, next) => {
    console.log('Callback received. Session:', req.session);
    console.log('Query:', req.query);
    next();
  },
  passport.authenticate('twitter', {
    failureRedirect: '/api/auth/twitter/failed',
    failureMessage: true,
    successRedirect: '/api/auth/twitter/success',
  }),
);

// Tambahkan endpoint success
router.get('/twitter/success', (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Tambahkan endpoint failed
router.get('/twitter/failed', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Authentication failed',
  });
});

// Clear session endpoint
router.get('/twitter/clear', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Failed to log out user:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to log out user',
      });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Failed to clear session:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to clear session',
        });
      }
      res.clearCookie('connect.sid');
      // passport.unuse('twitter');
      res.json({
        success: true,
        message: 'Session cleared successfully',
      });
    });
  });
});

// Complete logout endpoint
router.get('/twitter/logout', (req: Request, res: Response) => {
  // Store session info for logging
  const sessionInfo = {
    sessionID: req.sessionID,
    user: req.user,
    passport: req.session?.destroy,
  };

  // 1. Log out from Passport
  req.logout((err) => {
    if (err) {
      console.error('Passport logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to logout from passport',
        error: err.message,
      });
    }

    // 2. Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to destroy session',
          error: err.message,
        });
      }

      // 3. Clear all related cookies
      res.clearCookie('connect.sid', {
        path: '/',
      });

      // Clear any additional cookies that might be set
      res.clearCookie('twitter_oauth_token');
      res.clearCookie('twitter_oauth_token_secret');

      console.log('Cleared session info:', sessionInfo);

      // 4. Send success response with redirect
      res.json({
        success: true,
        message: 'Logged out successfully',
        clearedSession: sessionInfo,
        nextSteps: 'Please close your browser to complete the logout process',
      });
    });
  });
});

// Add a forceful logout endpoint for debugging
router.get('/twitter/logout/force', (req: Request, res: Response) => {
  // Force remove all session data
  if (req.session) {
    req.session.destroy((err) => {
      console.log('Force destroyed session');
    });
  }

  // Clear all possible cookies
  const cookies = req.cookies;
  for (let cookie in cookies) {
    res.clearCookie(cookie, {
      path: '/',
      domain: req.hostname,
    });
  }

  // Reset Passport
  if (req.user) {
    delete req.user;
  }

  res.json({
    success: true,
    message: 'Force logout completed',
    clearedCookies: Object.keys(cookies || {}),
  });
});

// Add a status check endpoint
router.get('/twitter/status', (req: Request, res: Response) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    session: {
      id: req.sessionID,
      passport: req.session?.cookie,
      cookie: req.session?.cookie,
    },
    user: req.user,
  });
});

// Add a while error endpoint
router.get('/twitter/error', (req: Request, res: Response) => {
  res.status(401).json({
    success: false,
    message: 'Authentication failed',
  });
});

export default router;
