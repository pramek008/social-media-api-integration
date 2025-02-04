import express from 'express';
import path from 'path';
import { Request, Response } from 'express';
import { upload } from '../middlewares/upload';
import fs from 'fs';

const router = express.Router();

router.post(
  '/uploads',
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    try {
      const fileUpload = req.files as Express.Multer.File[];
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      const fileUrls = fileUpload?.map(
        (file: Express.Multer.File) =>
          `${baseUrl}/api/media/uploads/${file.filename}`,
      );

      res.json({ urls: fileUrls });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload media' });
    }
  },
);

// Modified get route to handle both images and videos
router.get('/uploads/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file extension
    const ext = path.extname(filename).toLowerCase();
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    // If it's a video file, handle streaming
    if (videoExtensions.includes(ext)) {
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });

        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': ext === '.mov' ? 'video/quicktime' : 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': ext === '.mov' ? 'video/quicktime' : 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      // For non-video files (images, etc.), use sendFile
      res.sendFile(filePath, (err) => {
        if (err) {
          res.status(404).json({ error: 'File not found' });
        }
      });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

export default router;
