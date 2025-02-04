// src/routes/tweets.ts
import express from 'express';
import { upload } from '../middlewares/upload';
import { isAuthenticated } from '../middlewares/auth';
import { UserCredentialAttributes } from '../types';
import { ScheduledTweet } from '../models';
import { Request, Response } from 'express';
import { TweetScheduler } from '../services/sceduler';

const router = express.Router();
// Buat instance scheduler
const tweetScheduler = new TweetScheduler();

router.post(
  '/schedule',
  //   isAuthenticated,
  upload.array('media', 4),
  async (req: Request, res: Response) => {
    try {
      const { content, scheduledFor } = req.body;
      const userId = parseInt(req.query.userId as string, 10); // Fix integer error
      const mediaFiles = req.files as Express.Multer.File[];
      const user = req.user as UserCredentialAttributes;

      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      // Upload media files using the media service
      const mediaUrls = mediaFiles?.map(
        (file: Express.Multer.File) => `/uploads/${file.filename}`,
        //   `${baseUrl}/api/media/uploads/${file.filename}`,
      );

      // Adjust scheduled time to GMT+7
      const scheduledTime = new Date(scheduledFor);
      scheduledTime.setHours(scheduledTime.getHours() - 7);

      const tweet = await ScheduledTweet.create({
        userId: userId,
        content,
        scheduledTime: scheduledTime,
        status: 'pending',
        mediaUrls: mediaUrls.join(','),
      });

      await tweetScheduler.addJob(tweet.id);

      res.json({
        ...tweet.toJSON(),
        nextRun: tweetScheduler.getNextRunTime(tweet.id),
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to schedule tweet' });
    }
  },
);

router.post(
  '/schedule-payload-text',
  //   isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { content, scheduledFor, mediaUrls } = req.body;
      const userId = parseInt(req.query.userId as string, 10); // Fix integer error

      // Adjust scheduled time to GMT+7
      const scheduledTime = new Date(scheduledFor);
      scheduledTime.setHours(scheduledTime.getHours() - 7);

      const tweet = await ScheduledTweet.create({
        userId,
        content,
        mediaUrls: mediaUrls,
        scheduledTime,
        status: 'pending',
      });

      res.json(tweet);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to schedule tweet' });
    }
  },
);

router.get('/scheduled', async (req: any, res: any) => {
  try {
    const user = req.user as UserCredentialAttributes;
    const userId = parseInt(req.params.userId, 10); // Fix integer error
    const tweets = await ScheduledTweet.findAll({
      //   where: { userId: userId },
      order: [['scheduledTime', 'ASC']],
    });

    res.json(tweets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch scheduled tweets' });
  }
});

router.get('/scheduled/status-job', async (req: any, res: any) => {
  try {
    const getScheduledJobs = tweetScheduler.getScheduledJobs();
    res.json(getScheduledJobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch scheduled tweets' });
  }
});

export default router;
