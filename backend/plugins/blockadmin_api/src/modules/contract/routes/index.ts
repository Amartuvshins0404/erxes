import { Router } from 'express';
import { router as contractRoutes } from './contract';
import { router as offerRoutes } from './offer';
import { router as paymentRoutes } from './payment';

const router: Router = Router();

router.use(contractRoutes);
router.use(offerRoutes);
router.use(paymentRoutes);

export { router };
