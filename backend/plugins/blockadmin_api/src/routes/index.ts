import { router as agencyRoutes } from '@/agency/routes';
import { router as attachmentRoutes } from '@/attachment/routes';
import { router as buildingRoutes } from '@/building/routes';
import { router as developerRoutes } from '@/developer/routes';
import { router as documentRoutes } from '@/document/routes';
import { router as invoiceRoutes } from '@/invoice/routes';
import { router as listingRoutes } from '@/listing/routes';
import { router as projectRoutes } from '@/project/routes';
import { router as unitRoutes } from '@/unit/routes';
import { router as supplierRoutes } from '@/supplier/profile/routes/webhook';
import { router as supplierProductRoutes } from '@/supplier/product/routes/webhook';
import { Router } from 'express';
import { contextMiddleware } from '~/middlewares/contextMiddleware';
import { validationMiddleware } from '~/middlewares/validationMiddleware';
import { modifierMiddleware } from '~/middlewares/modifierMiddleware';

const router: Router = Router();

router.use(
  '/webhook',
  [validationMiddleware, contextMiddleware, modifierMiddleware],
  [
    agencyRoutes,
    attachmentRoutes,
    buildingRoutes,
    developerRoutes,
    documentRoutes,
    invoiceRoutes,
    listingRoutes,
    projectRoutes,
    unitRoutes,
    supplierRoutes,
    supplierProductRoutes,
  ],
);

export { router };
