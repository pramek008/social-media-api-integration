// src/index.ts
import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import path from 'path';
import { sequelize } from './models';
import routes from './routes';
import { errorHandler } from './middlewares/error-handler';
import { TweetScheduler } from './services/sceduler';
import { configurePassport } from './config/passport';
import { configureSession } from './config/session';
import { configurePassportInstagram } from './config/passport-instagram';
import { InstargramSchedulers } from './services/scheduler-instagram';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'secret-session',
//   resave: true,  // Ubah ke true
//   saveUninitialized: true,  // Ubah ke true
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'lax',  // Ubah ke lax untuk OAuth flow
//     maxAge: 24 * 60 * 60 * 1000 // 24 jam
//   }
// }));
configureSession(app);

// Initialize and configure passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();
// configurePassportInstagram();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', routes);
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3000;
// const scheduler = new Scheduler();

// Buat instance scheduler
const tweetScheduler = new TweetScheduler();
const instagramSchedulers = new InstargramSchedulers();

// Start scheduler saat aplikasi mulai
tweetScheduler.start();
instagramSchedulers.start();

// Listen untuk events
tweetScheduler.on('jobCompleted', (tweetId) => {
  console.log(`Tweet ${tweetId} berhasil dipublish`);
});

tweetScheduler.on('jobFailed', (tweetId, error) => {
  console.error(`Tweet ${tweetId} gagal:`, error);
});

instagramSchedulers.on('jobCompleted', (postId) => {
  console.log(`Post ${postId} berhasil dipublish`);
});

instagramSchedulers.on('jobFailed', (postId, error) => {
  console.error(`Post ${postId} gagal:`, error);
});

sequelize
  .authenticate()
  .then(() => sequelize.sync())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // scheduler.start();
    });
  })
  .catch((err) => {
    console.error('Unable to start server:', err);
    process.exit(1);
  });
