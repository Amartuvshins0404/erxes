import { Router } from 'express';
import { router as memberRoutes } from './member';

const router: Router = Router();

router.use(memberRoutes);

export { router };
