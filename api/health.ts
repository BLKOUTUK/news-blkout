import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'healthy',
      service: 'news-blkout',
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
