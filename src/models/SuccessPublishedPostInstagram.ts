// import { DataTypes, Model } from 'sequelize';
// import { SuccessPublishedPostInstagramAttributes } from '../types';

// class SuccessPublishedPostInstagram
//   extends Model<SuccessPublishedPostInstagramAttributes>
//   implements SuccessPublishedPostInstagramAttributes
// {
//   id?: number | undefined;
//   postId!: string;
//   captionPayload!: string;
//   postMediaPayload!: string;
//   postUrl!: string;
//   userCredentialsId!: number;
//   scheduledPostId!: number;

//   public readonly createdAt!: Date;
//   public readonly updatedAt!: Date;
// }

// export const initSuccessPublishedPostInstagram = (
//   sequelize: any,
// ): typeof SuccessPublishedPostInstagram => {
//   SuccessPublishedPostInstagram.init(
//     {
//       id: {
//         type: DataTypes.INTEGER,
//         autoIncrement: true,
//         primaryKey: true,
//       },
//       postId: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       captionPayload: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//       },
//       postMediaPayload: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//       },
//       postUrl: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//       },
//       userCredentialsId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//       scheduledPostId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//     },
//     {
//       sequelize,
//       tableName: 'success_published_post_instagram',
//     },
//   );
//   return SuccessPublishedPostInstagram;
// };
