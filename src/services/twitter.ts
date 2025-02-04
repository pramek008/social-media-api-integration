import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs/promises';
import path from 'path';
import { twitterConfig } from '../config/twitter';
import {
  ScheduledTweetAttributes,
  SuccessPublishedTweetAttributes,
  UserCredentialAttributes,
} from '../types';
import { decrypt } from '../utils/encryption';
import { ScheduledTweet, SuccessPublishedTweet } from '../models';

export class TwitterService {
  private projectRoot: string;

  constructor() {
    // Set project root directory - adjust this based on your project structure
    this.projectRoot = process.cwd();
  }

  private createTwitterClient(
    encryptedAccessToken: string,
    encryptedAccessSecret: string,
  ): TwitterApi {
    const accessToken = decrypt(encryptedAccessToken);
    const accessSecret = decrypt(encryptedAccessSecret);

    return new TwitterApi({
      appKey: twitterConfig.consumerKey,
      appSecret: twitterConfig.consumerSecret,
      accessToken,
      accessSecret,
    });
  }

  private async readMediaFile(filePath: string): Promise<Buffer> {
    try {
      // Convert URL-style path to system path and resolve relative to project root
      const normalizedPath = filePath.replace(/^\//, '');
      const resolvedPath = path.join(this.projectRoot, normalizedPath);

      console.log(`Attempting to read file from: ${resolvedPath}`);

      // Check if file exists and is not a directory
      const stats = await fs.stat(resolvedPath);
      if (!stats.isFile()) {
        throw new Error(`Not a file: ${resolvedPath}`);
      }

      // Read the file
      const buffer = await fs.readFile(resolvedPath);
      return buffer;
    } catch (error) {
      console.error(`Error reading media file ${filePath}:`, error);
      throw error;
    }
  }

  private async uploadMedia(
    client: TwitterApi,
    mediaPath: string,
  ): Promise<string> {
    try {
      // Get file extension
      const ext = path.extname(mediaPath).toLowerCase();

      // Validate file extension
      const validExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.mp4',
        '.mov',
      ];
      if (!validExtensions.includes(ext)) {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      // Read file
      const mediaBuffer = await this.readMediaFile(mediaPath);

      // Define media category based on file type
      const mediaCategory = ext === '.mp4' ? 'tweet_video' : 'tweet_image';

      // Upload to Twitter
      console.log(
        `Uploading media: ${mediaPath} (${mediaBuffer.length} bytes)`,
      );
      const media = await client.v1.uploadMedia(
        mediaBuffer,
        {
          mimeType: this.getMimeType(ext),
        },
        true,
      );

      console.log(`Successfully uploaded media: ${JSON.stringify(media)}`);
      return media.media_id_string;
    } catch (error) {
      console.error(`Failed to upload media ${mediaPath}:`, error);
      // Re-throw the error to be handled by publishTweet
      throw error;
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  public async publishTweet(
    scheduledTweet: ScheduledTweetAttributes & {
      update: (data: Partial<ScheduledTweetAttributes>) => Promise<void>;
    },
    user: UserCredentialAttributes,
  ): Promise<void> {
    const mediaIds: string[] = [];
    let failedUploads = false;

    try {
      const client = this.createTwitterClient(
        user.twitterAccessToken,
        user.twitterAccessSecret,
      );

      const mediaUrls = scheduledTweet.mediaUrls?.split(',').filter(Boolean);
      console.log('Media URLs:', mediaUrls);

      // Upload media files if present
      if (mediaUrls?.length > 0) {
        for (const mediaUrl of mediaUrls) {
          try {
            const mediaId = await this.uploadMedia(client, mediaUrl);
            mediaIds.push(mediaId);
          } catch (mediaError) {
            console.error(`Failed to upload media ${mediaUrl}:`, mediaError);
            failedUploads = true;
            // Continue with other media files
          }
        }
      }

      // If all media uploads failed and there were supposed to be uploads, throw error
      if (failedUploads && mediaIds.length === 0 && mediaUrls?.length > 0) {
        throw new Error('All media uploads failed');
      }

      // Prepare tweet payload
      const tweetPayload: any = {
        text: scheduledTweet.content,
      };

      // Add media IDs if any were successfully uploaded
      if (mediaIds.length > 0) {
        tweetPayload.media = {
          media_ids: mediaIds,
        };
      }

      // Publish tweet
      console.log('Publishing tweet with payload:', tweetPayload);
      const publish = await client.v2.tweet(tweetPayload);

      // Ensure user.id and scheduledTweet.id are definitely defined
      if (!user.id || !scheduledTweet.id) {
        throw new Error('Missing required user ID or scheduled tweet ID');
      }

      const publishedTweet: SuccessPublishedTweetAttributes = {
        tweetId: publish.data.id,
        tweetTextPayload: publish.data.text,
        tweetMediaPayload: mediaIds.join(','),
        tweetUrl: `https://x.com/${user.username}/status/${publish.data.id}`,
        userCredentialsId: user.id,
        scheduledTweetId: scheduledTweet.id,
      };

      // Store published tweet in database
      await SuccessPublishedTweet.create(publishedTweet);
      console.log('Successfully published tweet:', publish);

      // Update scheduled tweet status
      await ScheduledTweet.update(
        {
          status: 'published',
        },
        {
          where: { id: scheduledTweet.id },
        },
      );
    } catch (error: any) {
      console.error('Failed to publish tweet:', error);
      // Store error message in database for debugging
      await ScheduledTweet.update(
        {
          status: 'failed',
          error: error.message.toString(),
        },
        {
          where: { id: scheduledTweet.id },
        },
      );
      throw error;
    }
  }
}
