import { Request, response, Response } from 'express';
import { UserCredentialInstagram } from '../models/UserCredentialInstagram';
import { decrypt } from '../utils/encryption';
import { ScheduledPostInstagramAttributes } from '../types';
import { ScheduledPostInstagram } from '../models';

const INSTAGRAM_BASE_URL = 'https://graph.instagram.com/v22.0/';

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
    const response = await fetch(
      `${INSTAGRAM_BASE_URL}/${instagramUserId}/media?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: mediaItem.type === 'IMAGE' ? mediaItem.url : undefined,
          video_url: ['VIDEO', 'REELS'].includes(mediaItem.type)
            ? mediaItem.url
            : undefined,
          media_type: mediaItem.type,
          is_carousel_item: isCarouselItem,
          caption: isCarouselItem ? undefined : caption, // Caption only for single posts
        }),
      },
    );
    console.log(`Response: ${JSON.stringify(response)}`);

    const data = await response.json();
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
    mediaIds: string[],
    caption: string,
  ): Promise<string> {
    const response = await fetch(
      `${INSTAGRAM_BASE_URL}/${instagramUserId}/media?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: mediaIds,
          caption: caption,
        }),
      },
    );

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

      let containerId: string;

      // Handle single post vs carousel
      if (mediaItems.length === 1) {
        // Single post (image, video, or reel)
        console.log('Create Single Media Container');
        containerId = await this.createSingleMediaContainer(
          userId.toString(),
          user.instagramUserId,
          accessToken,
          mediaItems[0],
          caption,
        );
      } else {
        // Carousel post
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
        console.log('Create Carousel Media Container');
        containerId = await this.createCarouselContainer(
          user.instagramUserId,
          accessToken,
          mediaContainerIds,
          caption || '',
        );
      }

      // Create scheduled post record
      const scheduledPost: ScheduledPostInstagramAttributes = {
        userId: userId,
        caption: caption!,
        mediaUrls: mediaItems.map((item) => item.url).join(', '),
        mediaType: mediaItems.length > 1 ? 'CAROUSEL' : mediaItems[0].type,
        containerId,
        scheduledTime: new Date(scheduledTime!),
        status: 'PENDING',
        retryCount: 0,
      };

      // Save scheduled post to database
      await ScheduledPostInstagram.create(scheduledPost);

      const resposeData = {
        ...scheduledPost,
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

      scheduledPost.instagramMediaId = data.id;
      scheduledPost.status = 'PUBLISHED';
      await scheduledPost.save();
    } catch (error) {
      console.error('Error publishing scheduled post:', error);
    }
  }
}
