// src/models/ScheduledTweet.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import { ScheduledTweetAttributes } from '../types';

class ScheduledTweet
  extends Model<ScheduledTweetAttributes>
  implements ScheduledTweetAttributes
{
  public id!: number;
  public userId!: number;
  public content!: string;
  public mediaUrls!: string;
  public scheduledTime!: Date;
  public status!: 'pending' | 'published' | 'failed';
  public error!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  userCredential: any;
}

export const initScheduledTweet = (
  sequelize: Sequelize,
): typeof ScheduledTweet => {
  ScheduledTweet.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
      },
      mediaUrls: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      scheduledTime: DataTypes.DATE,
      status: {
        type: DataTypes.ENUM('pending', 'published', 'failed'),
        defaultValue: 'pending',
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'scheduled_tweets',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  );

  return ScheduledTweet;
};
