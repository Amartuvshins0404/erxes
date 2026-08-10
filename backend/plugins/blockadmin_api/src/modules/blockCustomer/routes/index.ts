import { Router } from 'express';
import { router as customerRoutes } from './blockCustomer';

const router: Router = Router();

router.use(customerRoutes);

export { router };
