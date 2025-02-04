// src/models/User.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import { UserCredentialAttributes } from '../types';

class UserCredential
  extends Model<UserCredentialAttributes>
  implements UserCredentialAttributes
{
  public id!: number;
  public twitterId!: string;
  public twitterAccessToken!: string;
  public twitterAccessSecret!: string;
  public username!: string;
  public profileImageUrl!: string;
  public email!: string;
  public location!: string;
  public description!: string;
  public followersCount!: number;
  public friendsCount!: number;
  public displayName!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUserCredential = (
  sequelize: Sequelize,
): typeof UserCredential => {
  UserCredential.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      twitterId: {
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
      twitterAccessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      twitterAccessSecret: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      profileImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      followersCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      friendsCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: 'user_credentials',
      timestamps: true,
    },
  );

  return UserCredential;
};
