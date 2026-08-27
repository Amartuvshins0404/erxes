import { Router } from 'express';

import { router as profileWebhookRoutes } from '@/profile/routes/webhook';
import { contextMiddleware } from '~/middlewares/contextMiddleware';
import { validationMiddleware } from '~/middlewares/validationMiddleware';

const router: Router = Router();

router.use(
  '/webhook',
  [validationMiddleware, contextMiddleware],
  [profileWebhookRoutes],
);

export { router };
