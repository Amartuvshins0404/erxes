import { Router } from 'express';
import { router as paymentRoutes } from './payment';

const router: Router = Router();

router.use(paymentRoutes);

export { router };
