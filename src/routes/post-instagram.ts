import express from 'express';
import { Request, Response } from 'express';
import { InstagramService } from '../services/instagram';

const router = express.Router();

const instagramService = new InstagramService();

router.post('/post-instagram', async (req: Request, res: Response) => {
  try {
    const requestBody = req;

    const response = await instagramService.createMediaContainer(
      requestBody,
      res,
    );

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create media container' });
  }
});

export default router;
