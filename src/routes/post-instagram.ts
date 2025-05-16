import express from 'express';
import { Request, Response } from 'express';
import { InstagramService } from '../services/instagram';
import { InstargramSchedulers } from '../services/scheduler-instagram';

const router = express.Router();

const instagramService = new InstagramService();
const instagramSchedulers = new InstargramSchedulers();

router.post('/post-instagram', async (req: Request, res: Response) => {
  try {
    const requestBody = req;

    const response = await instagramService.createMediaContainer(
      requestBody,
      res,
    );

    await instagramSchedulers.addJob(response.id);

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create media container' });
  }
});

export default router;
