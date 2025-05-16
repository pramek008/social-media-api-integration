import { Request, response, Response } from 'express';
import { UserCredentialInstagram } from '../models/UserCredentialInstagram';
import { decrypt } from '../utils/encryption';
import { ScheduledPostInstagramAttributes } from '../types';
import { ScheduledPostInstagram } from '../models';
import { InstargramSchedulers } from './scheduler-instagram';
import { instagramConfig } from '../config/instagram';

const INSTAGRAM_BASE_URL = instagramConfig.base_api_url;

interface MediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'REELS';
}

export class InstagramService {
  private async createSingleMediaContainer(
    userId: string,
    instagramUserId: string,
    accessToken: string,
    mediaItem: MediaItem,
    caption?: string,
    isCarouselItem: boolean = false,
  ): Promise<string> {
    const body = {
      image_url: mediaItem.type === 'IMAGE' ? mediaItem.url : undefined,
      video_url: ['VIDEO', 'REELS'].includes(mediaItem.type)
        ? mediaItem.url
        : undefined,
      media_type: ['VIDEO', 'REELS'].includes(mediaItem.type)
        ? 'REELS'
        : 'IMAGE',
      is_carousel_item: isCarouselItem,
      caption: caption,
    };

    console.log(`Body: ${JSON.stringify(body)}`);

    const response = await fetch(
      `${INSTAGRAM_BASE_URL}/${instagramUserId}/media?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    console.log(`Response: ${JSON.stringify(data)}`);
    if (!data.id) {
      throw new Error(
        `Failed to create media container: ${JSON.stringify(data)}`,
      );
    }
    return data.id;
  }

  private async createCarouselContainer(
    instagramUserId: string,
    accessToken: string,
    mediaIds: string,
    caption: string,
  ): Promise<string> {
    const url = `${INSTAGRAM_BASE_URL}/${instagramUserId}/media?access_token=${accessToken}`;

    const body = {
      media_type: 'CAROUSEL',
      children: mediaIds,
      caption: caption,
    };

    // console.log(`Body: ${JSON.stringify(body)}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.id) {
      throw new Error(
        `Failed to create carousel container: ${JSON.stringify(data)}`,
      );
    }
    return data.id;
  }

  private validateMediaItems(mediaItems: MediaItem[]): void {
    if (!mediaItems.length) {
      throw new Error('At least one media item is required');
    }
    if (mediaItems.length > 10) {
      throw new Error('Maximum 10 media items allowed');
    }

    // For carousel posts, validate mixed content
    if (mediaItems.length > 1) {
      const hasReels = mediaItems.some((item) => item.type === 'REELS');
      if (hasReels) {
        throw new Error('Reels cannot be included in carousel posts');
      }
    }
  }
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async createMediaContainer(req: Request, res: Response): Promise<any> {
    try {
      const {
        userId,
        mediaItems,
        caption,
        scheduledTime,
      }: {
        userId: number;
        mediaItems: MediaItem[];
        caption?: string;
        scheduledTime: string;
      } = req.body;

      //validate request body
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!scheduledTime) {
        throw new Error('Scheduled time is required');
      }

      // Validate input
      this.validateMediaItems(mediaItems);

      // Find user and decrypt token
      const user = await UserCredentialInstagram.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = decrypt(user.accessToken);

      let containerId;
      let containerCaraouselId;
      const MAX_RETRIES = 3;
      let retryCount = 0;
      let errorMessage = null;

      if (mediaItems.length === 1) {
        // Single post handling remains the same
        containerId = await this.createSingleMediaContainer(
          userId.toString(),
          user.instagramUserId,
          accessToken,
          mediaItems[0],
          caption,
        );
      } else {
        // Carousel post with retry mechanism
        const mediaContainerIds = await Promise.all(
          mediaItems.map((mediaItem) =>
            this.createSingleMediaContainer(
              userId.toString(),
              user.instagramUserId,
              accessToken,
              mediaItem,
              undefined,
              true,
            ),
          ),
        );

        containerCaraouselId = mediaContainerIds;

        // Retry logic for carousel container
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            console.log(`Carousel Container Creation - Attempt ${attempt}`);
            await this.delay(5000 * attempt); // Exponential backoff

            containerId = await this.createCarouselContainer(
              user.instagramUserId,
              accessToken,
              mediaContainerIds.toString(),
              caption || '',
            );
            break; // Success, exit retry loop
          } catch (error) {
            console.error(
              `Carousel Container Creation Failed - Attempt ${attempt}:`,
              error,
            );

            retryCount = attempt;
            errorMessage = error as unknown as string;

            if (attempt === MAX_RETRIES) {
              // All attempts failed
              errorMessage = error as unknown as string;
              throw new Error(
                'Failed to create carousel container after maximum retries',
              );
            }
          }
        }
      }

      // Create scheduled post record
      const scheduledPost: ScheduledPostInstagramAttributes = {
        userId: userId,
        caption: caption!,
        mediaUrls: mediaItems.map((item) => item.url).join(', '),
        mediaType:
          mediaItems.length > 1
            ? 'CAROUSEL'
            : mediaItems.length === 1 && mediaItems[0].type === 'VIDEO'
            ? 'REELS'
            : 'IMAGE',
        containerId,
        containerCaraouselId: containerCaraouselId?.toString(),
        scheduledTime: new Date(scheduledTime!),
        status: 'PENDING',
        retryCount: retryCount,
        error: retryCount !== 3 ? undefined : errorMessage?.toString(),
      };

      // Save scheduled post to database
      const savedPost = await ScheduledPostInstagram.create(scheduledPost);

      const resposeData = {
        ...savedPost.dataValues,
        mediaUrls: scheduledPost.mediaUrls.split(','),
        scheduledTime: scheduledPost.scheduledTime.toISOString(),
      };

      return resposeData;
    } catch (error) {
      console.error('Error creating media container:', error);
      throw error;
    }
  }

  public async publishScheduledPost(scheduledPostId: number): Promise<void> {
    try {
      const scheduledPost = await ScheduledPostInstagram.findOne({
        where: { id: scheduledPostId },
      });
      if (!scheduledPost) {
        throw new Error('Scheduled post not found');
      }

      const user = await UserCredentialInstagram.findOne({
        where: { id: scheduledPost.userId },
      });
      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = decrypt(user.accessToken);
      const instagramUserId = user.instagramUserId;

      const response = await fetch(
        `${INSTAGRAM_BASE_URL}/${instagramUserId}/media_publish?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: scheduledPost.containerId,
          }),
        },
      );

      const data = await response.json();

      console.log('Publish Scheduled Post Response:', JSON.stringify(data));

      if (!response.ok) {
        throw new Error('Failed to publish scheduled post');
      }

      const getLinkPost = await fetch(
        `${INSTAGRAM_BASE_URL}/${data.id}?fields=id,shortcode,media_type,media_url,owner,timestamp,caption,like_count,comments_count,permalink,thumbnail_url&access_token=${accessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!getLinkPost.ok) {
        console.error('Failed to get link post', getLinkPost);
      }

      const dataLink = await getLinkPost.json();

      scheduledPost.instagramMediaId = data.id;
      scheduledPost.postUrl = dataLink.permalink;
      scheduledPost.status = 'PUBLISHED';
      await scheduledPost.save();
    } catch (error) {
      console.error('Error publishing scheduled post:', error);
    }
  }
}
