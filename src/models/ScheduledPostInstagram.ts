import { DataTypes, Model } from 'sequelize';
import { ScheduledPostInstagramAttributes } from '../types';

class ScheduledPostInstagram
  extends Model<ScheduledPostInstagramAttributes>
  implements ScheduledPostInstagramAttributes
{
  id?: number | undefined;
  userId!: number; // ID user yang membuat post
  caption!: string; // Caption untuk post
  mediaUrls!: string; // JSON string array of media URLs
  mediaType!: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS'; // Jenis media
  scheduledTime!: Date; // Waktu penjadwalan post
  containerId?: string; // ID container yang dibuat di Instagram
  containerCaraouselId?: string | undefined;
  instagramMediaId?: string; // ID media yang dipublikasikan di Instagram
  postUrl?: string | undefined;
  status!: 'PENDING' | 'PUBLISHED' | 'FAILED' | 'DRAFT';
  retryCount!: number; // Jumlah percobaan retry
  error?: string | undefined; // Pesan error jika gagal
  publishedAt?: Date; // Waktu post berhasil dipublikasikan

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  userCredentialInstagram: any;
}

export const initScheduledPostInstagram = (
  sequelize: any,
): typeof ScheduledPostInstagram => {
  ScheduledPostInstagram.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      caption: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      mediaUrls: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      mediaType: {
        type: DataTypes.ENUM('IMAGE', 'VIDEO', 'CAROUSEL', 'REELS'),
        allowNull: false,
      },
      scheduledTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      containerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      containerCaraouselId: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      instagramMediaId: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      postUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'PUBLISHED', 'FAILED', 'DRAFT'),
        defaultValue: 'PENDING',
      },
      retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'scheduled_post_instagram',
    },
  );
  return ScheduledPostInstagram;
};
