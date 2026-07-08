import { Router } from 'express';
import { validationMiddleware } from '~/middlewares/validationMiddleware';
import { router as platformWebhookRouter } from '@/supplier/routes/webhook';
import { router as collectiveWebhookRouter } from '@/collective/routes/webhook';

const router: Router = Router();

// Collective webhook lives at /webhook/mushop/collective; mounted before the
// platform router so its specific path wins over /:platform/*.
router.use('/webhook/mushop', validationMiddleware, collectiveWebhookRouter);
router.use('/webhook', validationMiddleware, platformWebhookRouter);

export { router };
