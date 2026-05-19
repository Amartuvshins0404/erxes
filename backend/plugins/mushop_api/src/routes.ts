import { Router } from 'express';
import { validationMiddleware } from '~/middlewares/validationMiddleware';
import { router as supplierWebhookRoutes } from '@/supplier/routes/webhook';
import { router as productWebhookRoutes } from '@/product/routes/webhook';
import { router as collectiveWebhookRoutes } from '@/collective/routes/webhook';
import { router as collectivePackageWebhookRoutes } from '@/collective-package/routes/webhook';

const router: Router = Router();

router.use('/webhook', validationMiddleware, [
  supplierWebhookRoutes,
  productWebhookRoutes,
  collectiveWebhookRoutes,
  collectivePackageWebhookRoutes,
]);

export default router;
