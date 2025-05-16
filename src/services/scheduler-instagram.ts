import EventEmitter from 'events';
import schedule from 'node-schedule';
import { InstagramService } from './instagram';
import {
  ScheduledPostInstagramAttributes,
  UserCredentialInstagramAttributes,
} from '../types';
import { ScheduledPostInstagram, UserCredentialInstagram } from '../models';

export class InstargramSchedulers extends EventEmitter {
  private instagramService: InstagramService;
  private scheduledJobs: Map<number, schedule.Job>;
  private isInitialized: boolean;

  constructor() {
    super();
    this.instagramService = new InstagramService();
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  private scheduleJob(
    instagremPost: ScheduledPostInstagramAttributes & {
      update: (
        data: Partial<ScheduledPostInstagramAttributes>,
      ) => Promise<void>;
    },
    user: UserCredentialInstagramAttributes,
  ): void {
    // Cancel existing job if it exists
    this.cancelJob(instagremPost.id!);

    // Schedule the new job
    const job = schedule.scheduleJob(
      new Date(instagremPost.scheduledTime),
      async () => {
        try {
          console.log(`Executing scheduled instagremPost ${instagremPost.id}`);
          await this.instagramService.publishScheduledPost(instagremPost.id!);
          this.emit('jobCompleted', instagremPost.id);
        } catch (error) {
          console.error(
            `Failed to publish instagremPost ${instagremPost.id}:`,
            error,
          );
          this.emit('jobFailed', instagremPost.id, error);
        } finally {
          // Clean up the job from our map
          this.scheduledJobs.delete(instagremPost.id!);
        }
      },
    );

    if (job) {
      this.scheduledJobs.set(instagremPost.id!, job);
      console.log(
        `Scheduled instagremPost ${instagremPost.id} for ${instagremPost.scheduledTime}`,
      );
      this.emit('jobScheduled', instagremPost.id, instagremPost.scheduledTime);
    } else {
      console.error(`Failed to schedule instagremPost ${instagremPost.id}`);
      this.emit(
        'jobScheduleFailed',
        instagremPost.id,
        new Error('Failed to create schedule job'),
      );
    }
  }

  private async loadPendingPost(): Promise<void> {
    try {
      const pendingPost = await ScheduledPostInstagram.findAll({
        where: {
          status: 'PENDING',
        },
        include: [
          {
            model: UserCredentialInstagram,
            as: 'userCredential',
            required: true,
          },
        ],
      });

      console.log(`Found ${pendingPost.length} pending post ig`);

      for (const post of pendingPost) {
        const scheduledTime = new Date(post.scheduledTime);
        // Only schedule future tweets
        if (scheduledTime > new Date()) {
          this.scheduleJob(
            post.dataValues as any,
            post.userCredentialInstagram as any,
          );
        } else {
          console.log(
            `Skipping past post ig ${post.id} scheduled for ${post.scheduledTime}`,
          );
        }
      }
    } catch (error) {
      console.error('Failed to load pending post ig:', error);
    }
  }

  public async addJob(postId: number): Promise<void> {
    try {
      const post = await ScheduledPostInstagram.findByPk(postId);
      if (post) {
        const scheduledTime = new Date(post.scheduledTime);
        // Only schedule future tweets
        if (scheduledTime > new Date()) {
          this.scheduleJob(
            post.dataValues as any,
            post.userCredentialInstagram,
          );
        } else {
          console.log(
            `Skipping past post ig ${post.id} scheduled for ${post.scheduledTime}`,
          );
        }
      } else {
        console.log(`Post ig ${postId} not found`);
      }
    } catch (error) {
      console.error('Failed to schedule post ig:', error);
    }
  }

  private cancelJob(id: number): void {
    const job = this.scheduledJobs.get(id);
    if (job) {
      job.cancel();
      this.scheduledJobs.delete(id);
    }
  }

  public getScheduledJobs(): Array<{ id: number; nextRun: Date }> {
    return Array.from(this.scheduledJobs.entries()).map(([id, job]) => ({
      id,
      nextRun: job.nextInvocation(),
    }));
  }

  public async start(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Scheduler Instagram already initialized');
      return;
    }

    try {
      await this.loadPendingPost();
      this.isInitialized = true;
      console.log('Scheduler Instagram started successfully');
    } catch (error) {
      console.error('Failed to start scheduler instagram:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler and cancel all jobs
   */
  public stop(): void {
    for (const [postId, job] of this.scheduledJobs.entries()) {
      job.cancel();
      this.emit('jobCancelled', postId);
    }
    this.scheduledJobs.clear();
    this.isInitialized = false;
    console.log('Scheduler stopped');
  }
}
