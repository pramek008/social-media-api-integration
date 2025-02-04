// src/routes/index.js
import express from 'express';
import auth from '../routes/auth';
import media from '../routes/media';
import tweets from '../routes/tweets';
import authInstagram from '../routes/auth-instagram';
import postInstagram from '../routes/post-instagram';
import { logger } from '../utils/logger';

const router = express.Router();

router.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`);
  logger.info(`Headers: ${JSON.stringify(req.headers)}`);
  logger.info(`Body: ${JSON.stringify(req.body)}`);
  next();
});

router.use('/auth', auth);
router.use('/media', media);
router.use('/tweets', tweets);
router.use('/auth-ig', authInstagram);
router.use('/post-ig', postInstagram);

export default router;
