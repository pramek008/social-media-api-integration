import { DataTypes, Model, Sequelize } from 'sequelize';
import { UserCredentialInstagramAttributes } from '../types';

export class UserCredentialInstagram
  extends Model<UserCredentialInstagramAttributes>
  implements UserCredentialInstagramAttributes
{
  public id?: number | undefined;
  public instagramUserId!: string;
  public username!: string;
  public displayName!: string;
  public accessToken!: string;
  public tokenExpiresIn!: Date;
  public profilePictureUrl!: string;
  public followersCount!: number;
  public followsCount!: number;
  public mediaCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUserCredentialInstagram = (
  sequelize: Sequelize,
): typeof UserCredentialInstagram => {
  UserCredentialInstagram.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      instagramUserId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tokenExpiresIn: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      profilePictureUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      followersCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      followsCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mediaCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'UserCredentialInstagram',
      tableName: 'user_credentials_instagram',
      timestamps: true,
    },
  );

  return UserCredentialInstagram;
};
