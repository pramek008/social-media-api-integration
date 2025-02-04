import { Model, DataTypes, Sequelize } from 'sequelize';
import { SuccessPublishedTweetAttributes } from '../types';

class SuccessPublishedTweet
  extends Model<SuccessPublishedTweetAttributes>
  implements SuccessPublishedTweetAttributes
{
  public id!: number;
  public tweetId!: string;
  public tweetTextPayload!: string;
  public tweetMediaPayload!: string;
  public tweetUrl!: string;
  public userCredentialsId!: number;
  public scheduledTweetId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initSuccessPublishedTweet = (
  sequelize: Sequelize,
): typeof SuccessPublishedTweet => {
  SuccessPublishedTweet.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tweetId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tweetTextPayload: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tweetMediaPayload: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tweetUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userCredentialsId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      scheduledTweetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SuccessPublishedTweet',
      tableName: 'success_published_tweets',
    },
  );

  return SuccessPublishedTweet;
};
