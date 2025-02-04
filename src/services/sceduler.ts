// src/services/scheduler.ts
// import cron from 'node-cron';
// import { Op } from 'sequelize';
// import { ScheduledTweet, UserCredential } from '../models';
// import { TwitterService } from './twitter';

// export class Scheduler {
//   private twitterService: TwitterService;

//   constructor() {
//     this.twitterService = new TwitterService();
//   }

//   public start(): void {
//     cron.schedule('* * * * *', async () => {
//       try {
//         const pendingTweets = await ScheduledTweet.findAll({
//           where: {
//             status: 'pending',
//             scheduledTime: {
//               [Op.lte]: new Date(),
//             },
//           },
//           include: [
//             {
//               model: UserCredential,
//               as: 'userCredential', // sesuai dengan alias yang didefinisikan di model
//             },
//           ],
//         });

//         console.log('Current time:', new Date());
//         console.log(
//           'Pending tweets:',
//           pendingTweets.map((t) => t.toJSON()),
//         );

//         for (const tweet of pendingTweets) {
//           if (tweet.userCredential) {
//             console.log('Publishing tweet:', tweet.id);
//             await this.twitterService.publishTweet(
//               tweet.toJSON(),
//               tweet.userCredential,
//             );
//           } else {
//             console.log('No user credential found for tweet:', tweet.id);
//           }
//         }
//       } catch (error) {
//         console.error('Scheduler error:', error);
//       }
//     });
//   }
// }

import schedule from 'node-schedule';
import { ScheduledTweet, UserCredential } from '../models';
import { TwitterService } from './twitter';
import { EventEmitter } from 'events';
import { ScheduledTweetAttributes, UserCredentialAttributes } from '../types';

export class TweetScheduler extends EventEmitter {
  private twitterService: TwitterService;
  private scheduledJobs: Map<number, schedule.Job>;
  private isInitialized: boolean;

  constructor() {
    super();
    this.twitterService = new TwitterService();
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Schedule a single tweet for publication
   */
  private scheduleJob(
    tweet: ScheduledTweetAttributes & {
      update: (data: Partial<ScheduledTweetAttributes>) => Promise<void>;
    },
    user: UserCredentialAttributes,
  ): void {
    // Cancel existing job if it exists
    this.cancelJob(tweet.id!);

    // Schedule the new job
    const job = schedule.scheduleJob(
      new Date(tweet.scheduledTime),
      async () => {
        try {
          console.log(`Executing scheduled tweet ${tweet.id}`);
          await this.twitterService.publishTweet(tweet, user);
          this.emit('jobCompleted', tweet.id);
        } catch (error) {
          console.error(`Failed to publish tweet ${tweet.id}:`, error);
          this.emit('jobFailed', tweet.id, error);
        } finally {
          // Clean up the job from our map
          this.scheduledJobs.delete(tweet.id!);
        }
      },
    );

    if (job) {
      this.scheduledJobs.set(tweet.id!, job);
      console.log(`Scheduled tweet ${tweet.id} for ${tweet.scheduledTime}`);
      this.emit('jobScheduled', tweet.id, tweet.scheduledTime);
    } else {
      console.error(`Failed to schedule tweet ${tweet.id}`);
      this.emit(
        'jobScheduleFailed',
        tweet.id,
        new Error('Failed to create schedule job'),
      );
    }
  }

  /**
   * Load all pending tweets from database and schedule them
   */
  private async loadPendingTweets(): Promise<void> {
    try {
      const pendingTweets = await ScheduledTweet.findAll({
        where: {
          status: 'pending',
        },
        include: [
          {
            model: UserCredential,
            as: 'userCredential',
            required: true,
          },
        ],
      });

      console.log(`Found ${pendingTweets.length} pending tweets`);

      for (const tweet of pendingTweets) {
        const scheduledTime = new Date(tweet.scheduledTime);
        // Only schedule future tweets
        if (scheduledTime > new Date()) {
          this.scheduleJob(tweet as any, tweet.userCredential as any);
        } else {
          console.log(
            `Skipping past tweet ${tweet.id} scheduled for ${tweet.scheduledTime}`,
          );
        }
      }
    } catch (error) {
      console.error('Error loading pending tweets:', error);
      throw error;
    }
  }

  /**
   * Add a new tweet to be scheduled
   */
  public async addJob(tweetId: number): Promise<void> {
    try {
      const tweet = await ScheduledTweet.findOne({
        where: { id: tweetId },
        include: [
          {
            model: UserCredential,
            as: 'userCredential',
            required: true,
          },
        ],
      });

      if (!tweet) {
        throw new Error(`Tweet ${tweetId} not found`);
      }

      // Only schedule future tweets
      if (new Date(tweet.scheduledTime) > new Date()) {
        this.scheduleJob(tweet as any, tweet.userCredential as any);
      } else {
        throw new Error(`Tweet ${tweetId} scheduled time has already passed`);
      }
    } catch (error) {
      console.error(`Error scheduling tweet ${tweetId}:`, error);
      this.emit('jobScheduleFailed', tweetId, error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled tweet
   */
  public cancelJob(tweetId: number): boolean {
    const job = this.scheduledJobs.get(tweetId);
    if (job) {
      job.cancel();
      this.scheduledJobs.delete(tweetId);
      this.emit('jobCancelled', tweetId);
      return true;
    }
    return false;
  }

  /**
   * Get next run time for a scheduled tweet
   */
  public getNextRunTime(tweetId: number): Date | null {
    const job = this.scheduledJobs.get(tweetId);
    return job ? job.nextInvocation() : null;
  }

  /**
   * Get all scheduled jobs
   */
  public getScheduledJobs(): Array<{ id: number; nextRun: Date }> {
    return Array.from(this.scheduledJobs.entries()).map(([id, job]) => ({
      id,
      nextRun: job.nextInvocation(),
    }));
  }

  /**
   * Start the scheduler
   */
  public async start(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Scheduler Twitter already initialized');
      return;
    }

    try {
      await this.loadPendingTweets();
      this.isInitialized = true;
      console.log('Scheduler Twitter started successfully');
    } catch (error) {
      console.error('Failed to start scheduler twitter:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler and cancel all jobs
   */
  public stop(): void {
    for (const [tweetId, job] of this.scheduledJobs.entries()) {
      job.cancel();
      this.emit('jobCancelled', tweetId);
    }
    this.scheduledJobs.clear();
    this.isInitialized = false;
    console.log('Scheduler stopped');
  }
}
