// src/models/index.ts
import { Sequelize } from 'sequelize';
import { initUserCredential } from './UserCredential';
import { initSuccessPublishedTweet } from './SuccessPublishedTweet';
import config from '../config/database';
import { initScheduledTweet } from './ScheduledTweet';
import { initUserCredentialInstagram } from './UserCredentialInstagram';
import { initScheduledPostInstagram } from './ScheduledPostInstagram';

const sequelize = new Sequelize(config);

// Initialize models twitter
const UserCredential = initUserCredential(sequelize);
const ScheduledTweet = initScheduledTweet(sequelize);
const SuccessPublishedTweet = initSuccessPublishedTweet(sequelize);

// Initialize models instagram
const UserCredentialInstagram = initUserCredentialInstagram(sequelize);
const ScheduledPostInstagram = initScheduledPostInstagram(sequelize);
// const SuccessPublishedPostInstagram =
//   initSuccessPublishedPostInstagram(sequelize);

// Define relationships twitter
UserCredential.hasMany(ScheduledTweet, {
  foreignKey: 'userId',
  as: 'scheduledTweets',
});

UserCredential.hasMany(SuccessPublishedTweet, {
  foreignKey: 'userCredentialsId',
  as: 'publishedTweets',
});

ScheduledTweet.belongsTo(UserCredential, {
  foreignKey: 'userId',
  as: 'userCredential',
});

ScheduledTweet.hasMany(SuccessPublishedTweet, {
  foreignKey: 'scheduledTweetId',
  as: 'publishedTweets',
});

SuccessPublishedTweet.belongsTo(UserCredential, {
  foreignKey: 'userCredentialsId',
  as: 'userCredential',
});

SuccessPublishedTweet.belongsTo(ScheduledTweet, {
  foreignKey: 'scheduledTweetId',
  as: 'scheduledTweet',
});

// Define relationships instagram
UserCredentialInstagram.hasMany(ScheduledPostInstagram, {
  foreignKey: 'userId',
  as: 'scheduledPosts',
});

ScheduledPostInstagram.belongsTo(UserCredentialInstagram, {
  foreignKey: 'userId',
  as: 'userCredential',
});

// UserCredentialInstagram.hasMany(SuccessPublishedPostInstagram, {
//   foreignKey: 'userCredentialsId',
//   as: 'publishedPosts',
// });

// ScheduledPostInstagram.hasMany(SuccessPublishedPostInstagram, {
//   foreignKey: 'scheduledPostId',
//   as: 'publishedPosts',
// });

// SuccessPublishedPostInstagram.belongsTo(UserCredentialInstagram, {
//   foreignKey: 'userCredentialsId',
//   as: 'userCredential',
// });

// SuccessPublishedPostInstagram.belongsTo(ScheduledPostInstagram, {
//   foreignKey: 'scheduledPostId',
//   as: 'scheduledPost',
// });

// Export models and sequelize instance
export {
  sequelize,
  UserCredential,
  ScheduledTweet,
  SuccessPublishedTweet,
  UserCredentialInstagram,
  ScheduledPostInstagram,
  // SuccessPublishedPostInstagram,
};
