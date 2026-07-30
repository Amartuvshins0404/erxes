import * as fs from 'fs';
import * as path from 'path';
import { Router } from 'express';
import { validationMiddleware } from '~/middlewares/validationMiddleware';
import { router as supplierWebhookRoutes } from '@/supplier/routes/webhook';
import { router as productWebhookRoutes } from '@/product/routes/webhook';
import { router as collectiveWebhookRoutes } from '@/collective/routes/webhook';
import { router as collectivePackageWebhookRoutes } from '@/collective-package/routes/webhook';

const router: Router = Router();

router.get('/locales/:lng/:file', (req, res) => {
  const { lng, file } = req.params;

  const localesRoot = path.join(__dirname, './locales');

  try {
    const requestedPath = path.resolve(localesRoot, lng, file);
    const realPath = fs.realpathSync(requestedPath);

    if (!realPath.startsWith(localesRoot + path.sep)) {
      return res.status(403).send('Forbidden');
    }

    return res.json(JSON.parse(fs.readFileSync(realPath).toString()));
  } catch {
    return res.status(404).send('Not found');
  }
});

router.use('/webhook', validationMiddleware, [
  supplierWebhookRoutes,
  productWebhookRoutes,
  collectiveWebhookRoutes,
  collectivePackageWebhookRoutes,
]);

export default router;
