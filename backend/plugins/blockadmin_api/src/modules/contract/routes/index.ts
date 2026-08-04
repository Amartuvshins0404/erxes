import { Router } from 'express';
import { router as contractRoutes } from './contract';
import { router as offerRoutes } from './offer';

const router: Router = Router();

router.use(contractRoutes);
router.use(offerRoutes);

export { router };
