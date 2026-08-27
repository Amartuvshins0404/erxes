import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

const { OROLTSOO_ADMIN_SECRET = '' } = process.env || {};

export const validationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!OROLTSOO_ADMIN_SECRET) {
    console.error('OROLTSOO_ADMIN_SECRET is not set');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const signature = req.headers['x-signature'];

  if (!signature || typeof signature !== 'string') {
    return res.status(401).json({ message: 'Missing signature' });
  }

  try {
    const expected = `sha256=${crypto
      .createHmac('sha256', OROLTSOO_ADMIN_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex')}`;

    const received = Buffer.from(signature);
    const digest = Buffer.from(expected);

    if (
      received.length !== digest.length ||
      !crypto.timingSafeEqual(received, digest)
    ) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    next();
  } catch (error) {
    console.error('Failed to verify webhook signature', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
